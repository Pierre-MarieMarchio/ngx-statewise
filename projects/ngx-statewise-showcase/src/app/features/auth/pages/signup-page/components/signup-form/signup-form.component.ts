import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { SignupSubmit } from '../../../../interfaces/form-submits.interfaces';
import { matchValidator } from '@app/core/validators/match.validators';

@Component({
  selector: 'app-signup-form',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signup-form.component.html',
  styleUrl: './signup-form.component.scss',
})
export class SignupFormComponent {
  public formSubmit = output<SignupSubmit>();

  public email = signal<string>('');
  public hidePW1 = signal<boolean>(true);
  public hidePW2 = signal<boolean>(true);

  public signupForm = new FormGroup(
    {
      email: new FormControl<string>(this.email(), {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.email,
          Validators.maxLength(50),
        ],
      }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(30),
          Validators.pattern(
            /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/
          ),
        ],
      }),
      verifyPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [],
      }),
    },
    {
      validators: matchValidator(
        'password',
        'verifyPassword',
        'passwordMismatch'
      ),
    }
  );

  public handleSubmit(): void {
    const signupForm = this.signupForm.getRawValue();
    const isValid = this.signupForm.valid;
    if (signupForm && isValid) {
      this.formSubmit.emit(signupForm);
    }
  }

  public handlePW1Click(event: MouseEvent) {
    this.hidePW1.set(!this.hidePW1());
    event.stopPropagation();
  }

  public handlePW2Click(event: MouseEvent) {
    this.hidePW2.set(!this.hidePW2());
    event.stopPropagation();
  }
}
