import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  organizations = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Saint Mary Medical Center' },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Downtown Family Clinic' },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Pediatric Care Center' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      organizationId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const { email, password, organizationId } = this.loginForm.value;

    this.authService.login({ email, password, organizationId }).subscribe({
      next: (response) => {
        this.loading = false;
        
        // Navigate to dashboard
        const redirectUrl = localStorage.getItem('redirectUrl') || '/dashboard';
        localStorage.removeItem('redirectUrl');
        this.router.navigate([redirectUrl]);
      },
      error: (error) => {
        this.loading = false;
        console.error('Login error:', error);
        // TODO: Show user-friendly error message
        alert(`Login failed: ${error}`);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Password must be at least ${minLength} characters long`;
    }
    
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
      organizationId: 'Organization'
    };
    return fieldNames[fieldName] || fieldName;
  }
}