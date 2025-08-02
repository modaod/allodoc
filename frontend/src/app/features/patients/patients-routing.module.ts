import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientsListComponent } from './patients-list/patients-list.component';
import { PatientFormComponent } from './patient-form/patient-form.component';
import { PatientDetailComponent } from './patient-detail/patient-detail.component';

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
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PatientsRoutingModule { }
