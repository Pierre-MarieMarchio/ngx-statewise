import { Routes } from '@angular/router';
import { loggedInGuard, loggedOutGuard } from './features/auth/guards';

/**
 * Every page is loaded on navigation: keeping them eager put the whole
 * application, Angular Material included, in the initial bundle.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedInGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedInGuard],
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
        (m) => m.DashboardPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'task',
    loadComponent: () =>
      import('./features/task/pages/task-page/task-page.component').then(
        (m) => m.TaskPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'project',
    loadComponent: () =>
      import('./features/project/pages/project-page/projects-page.component').then(
        (m) => m.ProjectsPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
];
