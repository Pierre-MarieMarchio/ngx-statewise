import { Component, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from './theme.service';

@Component({
  selector: 'dm-toggle',
  standalone: true,
  imports: [
    MatSlideToggleModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <button (click)="togleTheme()" mat-icon-button class="m-1 text-secondary">
      <mat-icon class="text-secondary icon-outlined">{{
        themeService.themeSignal() === 'dark'
          ? 'dark_mode_outlined'
          : 'light_mode'
      }}</mat-icon>
    </button>
  `,
})
export class DarkModeComponent {
  public readonly themeService = inject(ThemeService);

  public togleTheme(): void {
    this.themeService.updateTheme();
  }
}
