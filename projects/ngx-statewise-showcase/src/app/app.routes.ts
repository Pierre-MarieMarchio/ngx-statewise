import { Routes } from '@angular/router';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { SignupPageComponent } from './features/auth/pages/signup-page/signup-page.component';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { loggedGuard } from './features/auth/guards/logged.guard';
import { HomeComponent } from './features/dashbord/pages/home/home.component';
import { Test1Component } from './features/dashbord/pages/test1/test1.component';
import { Test2Component } from './features/dashbord/pages/test2/test2.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
    title: 'TodoList - Commencez à cocher',
  },
  {
    path: 'home',
    component: HomeComponent,
    title: 'TodoList - Commencez à cocher',
  },
  {
    path: 'test1',
    component: Test1Component,
    title: 'TodoList - Commencez à cocher',
  },
  {
    path: 'test2',
    component: Test2Component,
    title: 'TodoList - Commencez à cocher',
  },
  {
    path: 'signup',
    component: SignupPageComponent,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedGuard],
  },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'TodoList - Commencez à cocher',
    canActivate: [loggedGuard],
  },
];
