import { Component} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup-sucess-dialog',
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    RouterLink,
  ],
  templateUrl: './signup-sucess-dialog.component.html',
  styleUrl: './signup-sucess-dialog.component.scss',
})
export class SignupSucessDialogComponent {
}
