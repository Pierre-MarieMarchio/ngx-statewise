import { Injectable, signal } from '@angular/core';
import { Theme } from './theme.enum';


@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  public themeSignal = signal<Theme>(Theme.DARK);

  public setTheme(value: Theme): void {
    this.themeSignal.set(value);
  }

  public updateTheme(): void {
    this.themeSignal.update((value) =>
      value === Theme.DARK ? Theme.LIGHT : Theme.DARK
    );
  }
}


