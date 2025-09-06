import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientsListComponent } from './patients-list/patients-list.component';
import { PatientFormComponent } from './patient-form/patient-form.component';
import { PatientDetailComponent } from './patient-detail/patient-detail.component';
import { PatientConsultationsListComponent } from './patient-consultations-list/patient-consultations-list.component';
import { PatientPrescriptionsListComponent } from './patient-prescriptions-list/patient-prescriptions-list.component';
import { PatientConsultationDetailComponent } from './patient-consultation-detail/patient-consultation-detail.component';
import { PatientPrescriptionDetailComponent } from './patient-prescription-detail/patient-prescription-detail.component';

const routes: Routes = [
  {
    path: '',
    component: PatientsListComponent
  },
  {
    path: 'new',
    component: PatientFormComponent
  },
  {
    path: ':id',
    component: PatientDetailComponent
  },
  {
    path: ':id/edit',
    component: PatientFormComponent
  },
  {
    path: ':patientId/consultations',
    component: PatientConsultationsListComponent
  },
  {
    path: ':patientId/consultations/:consultationId',
    component: PatientConsultationDetailComponent
  },
  {
    path: ':patientId/prescriptions',
    component: PatientPrescriptionsListComponent
  },
  {
    path: ':patientId/prescriptions/:prescriptionId',
    component: PatientPrescriptionDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientsRoutingModule { }
