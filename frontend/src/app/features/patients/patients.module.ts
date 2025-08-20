import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { PatientsRoutingModule } from './patients-routing.module';
import { ConsultationsModule } from '../consultations/consultations.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { PatientsListComponent } from './patients-list/patients-list.component';
import { PatientFormComponent } from './patient-form/patient-form.component';
import { PatientDetailComponent } from './patient-detail/patient-detail.component';
import { PatientConsultationsListComponent } from './patient-consultations-list/patient-consultations-list.component';
import { PatientPrescriptionsListComponent } from './patient-prescriptions-list/patient-prescriptions-list.component';
import { PatientConsultationDetailComponent } from './patient-consultation-detail/patient-consultation-detail.component';
import { PatientPrescriptionDetailComponent } from './patient-prescription-detail/patient-prescription-detail.component';
import { PatientQuickCreateDialogComponent } from './patient-quick-create-dialog/patient-quick-create-dialog.component';
import { DATE_ADAPTER_PROVIDERS } from '../../core/utils/date-adapter-providers';

@NgModule({
  declarations: [
    PatientsListComponent,
    PatientFormComponent,
    PatientDetailComponent,
    PatientConsultationsListComponent,
    PatientPrescriptionsListComponent,
    PatientConsultationDetailComponent,
    PatientPrescriptionDetailComponent,
    PatientQuickCreateDialogComponent
  ],
  providers: [
    ...DATE_ADAPTER_PROVIDERS
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule,
    PatientsRoutingModule,
    ConsultationsModule,
    PrescriptionsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  exports: [
    PatientQuickCreateDialogComponent
  ]
})
export class PatientsModule { }
