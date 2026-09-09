import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [
    MatSlideToggleModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      (click)="toggleTheme()"
      mat-icon-button
      class="m-1 color-secondary"
      [attr.aria-label]="
        themeService.themeSignal() === 'dark'
          ? 'Switch to the light theme'
          : 'Switch to the dark theme'
      "
    >
      <mat-icon class="color-secondary icon-outlined">{{
        themeService.themeSignal() === 'dark'
          ? 'dark_mode_outlined'
          : 'light_mode'
      }}</mat-icon>
    </button>
  `,
})
export class ThemeToggleComponent {
  public readonly themeService = inject(ThemeService);

  public toggleTheme(): void {
    this.themeService.updateTheme();
  }
}
