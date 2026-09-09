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
      import('./pages/landing/landing-page.component').then(
        (m) => m.LandingPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedInGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedInGuard],
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/dashboard/dashboard-page.component').then(
        (m) => m.DashboardPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'task',
    loadComponent: () =>
      import('./pages/board/board-page.component').then(
        (m) => m.BoardPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'state',
    loadComponent: () =>
      import('./pages/inspection-live/inspection-live-page.component').then(
        (m) => m.InspectionLivePageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/inspection-history/inspection-history-page.component').then(
        (m) => m.InspectionHistoryPageComponent,
      ),
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
];
