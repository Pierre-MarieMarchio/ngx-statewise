import { Component, inject } from '@angular/core';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { LoginSubmit } from '../interfaces/form-submits.interfaces';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthManager } from '../states/auth-manager';


@Component({
  selector: 'app-login-page',
  imports: [LoginFormComponent, MatProgressBarModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  host: {
    class: 'mt-20',
  },
})
export class LoginPageComponent {
  public readonly authManager = inject(AuthManager);

  public onFormSubmit(formData: LoginSubmit) {
    this.authManager.login(formData);
  }
}
