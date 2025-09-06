import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrescriptionsListComponent } from './prescriptions-list/prescriptions-list.component';
import { PrescriptionFormComponent } from './prescription-form/prescription-form.component';
import { PrescriptionDetailComponent } from './prescription-detail/prescription-detail.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'new',
    component: PrescriptionFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['DOCTOR', 'ADMIN'] }
  },
  {
    path: ':id',
    component: PrescriptionDetailComponent
  },
  {
    path: ':id/edit',
    component: PrescriptionFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['DOCTOR', 'ADMIN'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrescriptionsRoutingModule { }
