import { Injectable, signal } from '@angular/core';
import { Theme } from './theme.enum';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly theme = signal<Theme>(Theme.DARK);

  public readonly themeSignal = this.theme.asReadonly();

  public setTheme(value: Theme): void {
    this.theme.set(value);
  }

  public updateTheme(): void {
    this.theme.update((value) =>
      value === Theme.DARK ? Theme.LIGHT : Theme.DARK,
    );
  }
}
