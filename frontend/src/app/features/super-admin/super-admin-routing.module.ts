import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuperAdminDashboardComponent } from './dashboard/super-admin-dashboard.component';
import { OrganizationsListComponent } from './organizations/organizations-list.component';
import { SystemUsersListComponent } from './users/system-users-list.component';

const routes: Routes = [
  {
    path: '',
    component: SuperAdminDashboardComponent
  },
  {
    path: 'dashboard',
    component: SuperAdminDashboardComponent
  },
  {
    path: 'organizations',
    component: OrganizationsListComponent
  },
  {
    path: 'users',
    component: SystemUsersListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperAdminRoutingModule { }