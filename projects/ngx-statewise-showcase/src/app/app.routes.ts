import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { LoginPageComponent } from './features/auth/pages/login-page.component';
import { HomeComponent } from './features/dashbord/pages/dashbord.component';
import { TaskPageComponent } from './features/task/pages';
import { loggedInGuard, loggedOutGuard } from './features/auth/guards';
import { ProjectsPageComponent, TeamsPageComponent } from './features/project-management/pages';

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
    component: HomeComponent,
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
  {
    path: 'team',
    component: TeamsPageComponent,
    title: 'Ngx-Statewise',
    canActivate: [loggedOutGuard],
  },
];
