import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup-btn',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './signup-btn.component.html',
  styleUrl: './signup-btn.component.scss',
})
export class SignupBtnComponent {}
