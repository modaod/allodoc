import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { SuperAdminRoutingModule } from './super-admin-routing.module';
import { SuperAdminDashboardComponent } from './dashboard/super-admin-dashboard.component';
import { OrganizationsListComponent } from './organizations/organizations-list.component';
import { SystemUsersListComponent } from './users/system-users-list.component';
import { OrganizationFormDialogComponent } from './organizations/organization-form-dialog.component';
import { UserRoleDialogComponent } from './users/user-role-dialog.component';
import { UserFormDialogComponent } from './users/user-form-dialog/user-form-dialog.component';
import { MoveUserDialogComponent } from './users/move-user-dialog/move-user-dialog.component';

@NgModule({
  declarations: [
    SuperAdminDashboardComponent,
    OrganizationsListComponent,
    SystemUsersListComponent,
    OrganizationFormDialogComponent,
    UserRoleDialogComponent,
    UserFormDialogComponent,
    MoveUserDialogComponent
  ],
  imports: [
    CommonModule,
    SuperAdminRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule
  ]
})
export class SuperAdminModule { }