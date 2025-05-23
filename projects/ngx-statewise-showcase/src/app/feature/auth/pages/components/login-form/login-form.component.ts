import {
  ChangeDetectionStrategy,
  Component,
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
import { LoginSubmit } from '@app/feature/auth/models';


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
    const signupForm = this.loginForm.getRawValue();
    const isValid = this.loginForm.valid;
    if (signupForm && isValid) {
      this.formSubmit.emit(signupForm);
    }
  }
}
