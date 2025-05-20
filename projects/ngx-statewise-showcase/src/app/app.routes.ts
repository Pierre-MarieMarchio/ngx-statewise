import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { SignupPageComponent } from './features/auth/pages/signup-page/signup-page.component';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { loggedInGuard } from './features/auth/guards/logged-in.guard';
import { HomeComponent } from './features/dashbord/pages/home/home.component';
import { Test1Component } from './features/dashbord/pages/test1/test1.component';
import { Test2Component } from './features/dashbord/pages/test2/test2.component';
import { loggedOutGuard } from './features/auth/guards/logged-out.guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedInGuard],
  },
  {
    path: 'signup',
    component: SignupPageComponent,
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
    path: 'test1',
    component: Test1Component,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedOutGuard],
  },
  {
    path: 'test2',
    component: Test2Component,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedOutGuard],
  },
];
