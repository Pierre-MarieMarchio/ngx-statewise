import { Component } from '@angular/core';
import { LogoComponent } from './components/logo/logo.component';
import { SignupBtnComponent } from './components/signup-btn/signup-btn.component';

@Component({
  selector: 'app-landing-page',
  imports: [LogoComponent, SignupBtnComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  host: {
    class: 'page',
  },
})
export class LandingPageComponent {}
