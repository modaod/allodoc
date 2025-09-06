import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-patient-consultation-detail',
  templateUrl: './patient-consultation-detail.component.html',
  styleUrls: ['./patient-consultation-detail.component.scss']
})
export class PatientConsultationDetailComponent implements OnInit {
  patientId: string = '';
  consultationId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.patientId = params['patientId'];
      this.consultationId = params['consultationId'];
    });
  }

  goBackToPatientConsultations(): void {
    this.router.navigate(['/patients', this.patientId, 'consultations']);
  }

  goToPatientDetail(): void {
    this.router.navigate(['/patients', this.patientId]);
  }
}
