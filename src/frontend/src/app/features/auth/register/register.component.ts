import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  organizations: any[] = [];
  loadingOrganizations = true;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      organizationId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Fetch organizations from backend
    this.fetchOrganizations();
  }

  private fetchOrganizations(): void {
    const apiUrl = environment.apiUrl || '/api/v1';
    this.http.get<any[]>(`${apiUrl}/auth/organizations`).subscribe({
      next: (orgs) => {
        this.organizations = orgs;
        this.loadingOrganizations = false;
      },
      error: (error) => {
        console.error('Failed to fetch organizations:', error);
        // Fallback to hardcoded organizations if API fails
        this.organizations = [
          { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Saint Mary Medical Center' },
          { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Downtown Family Clinic' },
          { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Pediatric Care Center' }
        ];
        this.loadingOrganizations = false;
      }
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Registration successful:', response);
        
        // Navigate to dashboard after successful registration
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Registration error:', error);
        
        // Show user-friendly error message
        let errorMessage = 'Registration failed. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 409) {
          errorMessage = 'Email already exists. Please use a different email.';
        }
        alert(errorMessage);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `${this.getFieldDisplayName(fieldName)} must be at least ${minLength} characters long`;
    }
    
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      password: 'Password',
      organizationId: 'Organization'
    };
    return fieldNames[fieldName] || fieldName;
  }
}