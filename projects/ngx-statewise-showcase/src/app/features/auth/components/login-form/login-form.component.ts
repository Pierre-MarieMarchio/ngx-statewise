import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LoginSubmit } from '@app/features/auth/models';

@Component({
  selector: 'app-login-form',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  /** Whether a sign-in is already running, so a second submit is refused. */
  public pending = input(false);

  public formSubmit = output<LoginSubmit>();
  public isPasswordHided = signal<boolean>(true);

  public hidePassword(event: MouseEvent) {
    this.isPasswordHided.set(!this.isPasswordHided());
    event.stopPropagation();
  }

  public loginForm = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  handleSubmit() {
    if (this.loginForm.invalid) {
      // Without this, submitting an untouched form shows no error at all:
      // Angular Material only renders one once the control has been touched.
      this.loginForm.markAllAsTouched();

      return;
    }

    this.formSubmit.emit(this.loginForm.getRawValue());
  }
}
