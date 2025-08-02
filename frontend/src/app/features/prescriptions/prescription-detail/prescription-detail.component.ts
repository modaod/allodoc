import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Prescription, PrescriptionStatus } from '../models/prescription.model';
import { PrescriptionsService } from '../services/prescriptions.service';

@Component({
  selector: 'app-prescription-detail',
  templateUrl: './prescription-detail.component.html',
  styleUrls: ['./prescription-detail.component.scss']
})
export class PrescriptionDetailComponent implements OnInit {
  prescription: Prescription | null = null;
  loading = false;
  prescriptionId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionsService: PrescriptionsService
  ) {}

  ngOnInit(): void {
    this.prescriptionId = this.route.snapshot.paramMap.get('id');
    if (this.prescriptionId) {
      this.loadPrescription(this.prescriptionId);
    }
  }

  loadPrescription(id: string): void {
    this.loading = true;
    this.prescriptionsService.getPrescriptionById(id).subscribe({
      next: (prescription) => {
        this.prescription = prescription;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prescription:', error);
        this.loading = false;
        this.router.navigate(['/prescriptions']);
      }
    });
  }

  editPrescription(): void {
    if (this.prescriptionId) {
      this.router.navigate(['/prescriptions', this.prescriptionId, 'edit']);
    }
  }

  deletePrescription(): void {
    if (this.prescription && confirm(`Are you sure you want to delete prescription ${this.prescription.prescriptionNumber}?`)) {
      this.prescriptionsService.deletePrescription(this.prescription.id!).subscribe({
        next: () => {
          this.router.navigate(['/prescriptions']);
        },
        error: (error) => {
          console.error('Error deleting prescription:', error);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/prescriptions']);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  getStatusClass(status: PrescriptionStatus): string {
    switch (status) {
      case PrescriptionStatus.ACTIVE:
        return 'status-active';
      case PrescriptionStatus.DISPENSED:
        return 'status-dispensed';
      case PrescriptionStatus.COMPLETED:
        return 'status-completed';
      case PrescriptionStatus.CANCELLED:
        return 'status-cancelled';
      case PrescriptionStatus.EXPIRED:
        return 'status-expired';
      case PrescriptionStatus.DRAFT:
        return 'status-draft';
      default:
        return '';
    }
  }

  printPrescription(): void {
    window.print();
  }

  isExpiringSoon(validUntil: Date | undefined): boolean {
    if (!validUntil) return false;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }

  isExpired(validUntil: Date | undefined): boolean {
    if (!validUntil) return false;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    return expiryDate < today;
  }

  getTotalMedications(): number {
    return this.prescription?.medications?.length || 0;
  }

  getRemainingDays(validUntil: Date | undefined): number {
    if (!validUntil) return 0;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
