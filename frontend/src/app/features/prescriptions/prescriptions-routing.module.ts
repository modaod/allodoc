import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrescriptionsListComponent } from './prescriptions-list/prescriptions-list.component';
import { PrescriptionFormComponent } from './prescription-form/prescription-form.component';
import { PrescriptionDetailComponent } from './prescription-detail/prescription-detail.component';

const routes: Routes = [
  {
    path: '',
    component: PrescriptionsListComponent
  },
  {
    path: 'new',
    component: PrescriptionFormComponent
  },
  {
    path: ':id',
    component: PrescriptionDetailComponent
  },
  {
    path: ':id/edit',
    component: PrescriptionFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrescriptionsRoutingModule { }
