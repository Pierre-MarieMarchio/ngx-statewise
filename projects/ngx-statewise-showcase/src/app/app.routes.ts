import { Routes } from '@angular/router';
import { LandingPageComponent } from './feature/landing-page/landing-page.component';
import { LoginPageComponent } from './feature/auth/pages/login-page.component';
import { loggedInGuard } from './feature/auth/guards/logged-in.guard';
import { HomeComponent } from './feature/dashbord/pages/dashbord.component';
import { loggedOutGuard } from './feature/auth/guards/logged-out.guard';
import { TaskPageComponent } from './feature/project-management/pages/task-page/task-page.component';
import { ProjectsPageComponent } from './feature/project-management/pages/project-pages/projects-page.component';
import { TeamsPageComponent } from './feature/project-management/pages/team-page/teams-page.component';

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
