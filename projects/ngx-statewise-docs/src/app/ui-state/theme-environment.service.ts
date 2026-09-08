import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  isTheme,
  type Theme,
} from './theme';

/**
 * The two places the theme lives outside Angular: `localStorage` and the
 * `<html>` attribute the stylesheet keys off. Every method is a no-op while
 * prerendering, where neither exists.
 */
@Injectable({ providedIn: 'root' })
export class ThemeEnvironment {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  public read(): Theme | null {
    if (!this.isBrowser) {
      return null;
    }

    // Storage throws rather than returning null when the browser blocks it,
    // and a docs page failing to boot over a colour is not a good trade.
    try {
      const stored: unknown = localStorage.getItem(THEME_STORAGE_KEY);
      return isTheme(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  public write(theme: Theme): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Reading it back will simply fall back to the default next time.
    }
  }

  public apply(theme: Theme): void {
    this.document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  }
}
