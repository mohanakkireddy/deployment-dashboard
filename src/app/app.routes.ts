import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'workflows',
    loadComponent: () => import('./features/workflows/workflows.component').then(m => m.WorkflowsComponent)
  },
  {
    path: 'deployments',
    loadComponent: () => import('./features/deployments/deployments.component').then(m => m.DeploymentsComponent)
  },
  {
    path: 'releases',
    loadComponent: () => import('./features/releases/releases.component').then(m => m.ReleasesComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
