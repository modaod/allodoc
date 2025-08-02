import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'patients',
    loadChildren: () => import('./features/patients/patients.module').then(m => m.PatientsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'consultations',
    loadChildren: () => import('./features/consultations/consultations.module').then(m => m.ConsultationsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'prescriptions',
    loadChildren: () => import('./features/prescriptions/prescriptions.module').then(m => m.PrescriptionsModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
