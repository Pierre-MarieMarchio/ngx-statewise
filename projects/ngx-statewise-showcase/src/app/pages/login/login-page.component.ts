import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DataStateComponent } from '@shared/ui/data-state';
import { LoginFormComponent } from '@app/features/auth/components';
import { AuthManager } from '@app/features/auth/states';
import { LoginSubmit } from '@app/features/auth/models';

@Component({
  selector: 'app-login-page',
  imports: [LoginFormComponent, DataStateComponent],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login-page.component.scss',
  /* The only page that was missing it, which is why it had no height to centre in. */
  host: {
    class: 'page',
  },
})
export class LoginPageComponent {
  public readonly authManager = inject(AuthManager);

  public onFormSubmit(formData: LoginSubmit) {
    this.authManager.login(formData);
  }
}
