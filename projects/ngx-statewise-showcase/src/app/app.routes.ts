import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { LoginPageComponent } from './features/auth/pages/login-page.component';
import { loggedInGuard } from './features/auth/guards/logged-in.guard';
import { HomeComponent } from './features/dashbord/pages/dashbord.component';
import { loggedOutGuard } from './features/auth/guards/logged-out.guard';
import { TaskPageComponent } from './features/tasks/pages/task-page.component';
import { ProjectsPageComponent } from './features/projects/pages/projects-page.component';
import { TeamsPageComponent } from './features/teams/pages/teams-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedInGuard],
  },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedInGuard],
  },
  {
    path: 'home',
    component: HomeComponent,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'task',
    component: TaskPageComponent,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'project',
    component: ProjectsPageComponent,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'team',
    component: TeamsPageComponent,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedOutGuard],
  },
];
