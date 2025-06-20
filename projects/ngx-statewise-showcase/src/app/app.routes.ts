import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { LoginPageComponent } from './features/auth/pages/login-page.component';
import { DashbordPageComponent } from './features/dashbord/pages';
import { TaskPageComponent } from './features/task/pages';
import { loggedInGuard, loggedOutGuard } from './features/auth/guards';
import { ProjectsPageComponent } from './features/project/pages';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    title: 'Ngx-Statewise',
    canActivate: [loggedInGuard],
  },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Ngx-Statewise',
    canActivate: [loggedInGuard],
  },
  {
    path: 'home',
    component: DashbordPageComponent,
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'task',
    component: TaskPageComponent,
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'project',
    component: ProjectsPageComponent,
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
];
