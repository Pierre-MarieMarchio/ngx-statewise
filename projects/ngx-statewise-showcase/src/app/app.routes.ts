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
      import('./features/project/pages/task-page/task-page.component').then(
        (m) => m.TaskPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'state',
    loadComponent: () =>
      import('./features/state-inspection/pages/live-state-page/live-state-page.component').then(
        (m) => m.LiveStatePageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./features/state-inspection/pages/history-page/history-page.component').then(
        (m) => m.HistoryPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
];
