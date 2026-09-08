import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { AuthManager } from '../states';
import { LoginSubmit } from '../models';

@Component({
  selector: 'app-login-page',
  imports: [LoginFormComponent, MatProgressBarModule],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  public readonly authManager = inject(AuthManager);

  public onFormSubmit(formData: LoginSubmit) {
    this.authManager.login(formData);
  }
}
