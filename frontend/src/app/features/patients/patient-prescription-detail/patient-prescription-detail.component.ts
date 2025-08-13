import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-patient-prescription-detail',
  templateUrl: './patient-prescription-detail.component.html',
  styleUrls: ['./patient-prescription-detail.component.scss']
})
export class PatientPrescriptionDetailComponent implements OnInit {
  patientId: string = '';
  prescriptionId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.patientId = params['patientId'];
      this.prescriptionId = params['prescriptionId'];
    });
  }

  goBackToPatientPrescriptions(): void {
    this.router.navigate(['/patients', this.patientId, 'prescriptions']);
  }

  goToPatientDetail(): void {
    this.router.navigate(['/patients', this.patientId]);
  }
}
