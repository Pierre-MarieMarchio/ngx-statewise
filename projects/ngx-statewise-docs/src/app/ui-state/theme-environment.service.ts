import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { THEME_CLASSES, THEME_STORAGE_KEY, isTheme, type Theme } from './theme';

/**
 * The two places the theme lives outside Angular: `localStorage` and the
 * `<html>` class the stylesheet keys off. Reading and writing storage is a
 * no-op while prerendering, where there is none.
 */
@Injectable({ providedIn: 'root' })
export class ThemeEnvironment {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * The theme to start on: a stored choice if there is one, otherwise the
   * system preference. Mirrors the inline script in `index.html`, which does
   * the same thing before Angular boots.
   */
  public read(): Theme | null {
    if (!this.isBrowser) {
      return null;
    }

    // Storage throws rather than returning null when the browser blocks it,
    // and a docs page failing to boot over a colour is not a good trade.
    try {
      const stored: unknown = localStorage.getItem(THEME_STORAGE_KEY);

      if (isTheme(stored)) {
        return stored;
      }
    } catch {
      // Blocked: fall through to the system preference.
    }

    return this.systemPreference();
  }

  private systemPreference(): Theme | null {
    if (typeof matchMedia !== 'function') {
      return null;
    }

    return matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
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
    const root = this.document.documentElement.classList;

    root.remove(...THEME_CLASSES.filter((candidate) => candidate !== theme));
    root.add(theme);
  }
}
