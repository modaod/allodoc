import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsultationsListComponent } from './consultations-list/consultations-list.component';
import { ConsultationFormComponent } from './consultation-form/consultation-form.component';
import { ConsultationDetailComponent } from './consultation-detail/consultation-detail.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: ConsultationsListComponent
  },
  {
    path: 'new',
    component: ConsultationFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['DOCTOR', 'ADMIN'] }
  },
  {
    path: ':id',
    component: ConsultationDetailComponent
  },
  {
    path: ':id/edit',
    component: ConsultationFormComponent,
    canActivate: [RoleGuard],
    data: { roles: ['DOCTOR', 'ADMIN'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConsultationsRoutingModule { }
