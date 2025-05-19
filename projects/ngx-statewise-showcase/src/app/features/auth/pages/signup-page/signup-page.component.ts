import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../services/auth.service';
import { SignupSucessDialogComponent } from './components/signup-sucess-dialog/signup-sucess-dialog.component';
import { SignupFailedDialogComponent } from './components/signup-failed-dialog/signup-failed-dialog.component';
import { SignupFormComponent } from './components/signup-form/signup-form.component';
import { SignupSubmit } from '../../interfaces/form-submits.interfaces';

@Component({
  selector: 'app-signup-page',
  imports: [SignupFormComponent],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.scss',
  host: {
    class: 'mt-20',
  },
})
export class SignupPageComponent {
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  public onFormSubmit(formData: SignupSubmit): void {
    console.log(formData);
    
    // this.authService.register(formData).subscribe({
    //   next: () => {
    //     const isRegistered = this.authService.getIsRegister();
    //     if (isRegistered()) {
    //       this.dialog.open(SignupSucessDialogComponent);
    //     } else {
    //       this.dialog.open(SignupFailedDialogComponent);
    //     }
    //   },
    //   error: () => {
    //     this.dialog.open(SignupFailedDialogComponent);
    //   },
    // });
  }
}
