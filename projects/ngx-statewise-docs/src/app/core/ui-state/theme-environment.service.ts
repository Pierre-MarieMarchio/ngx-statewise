import { DOCUMENT, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FALLBACK_THEME,
  LIGHT_QUERY,
  THEME_CLASSES,
  THEME_STORAGE_KEY,
  isThemeChoice,
  type Theme,
  type ThemeChoice,
} from './theme';

/**
 * The three places the theme lives outside Angular: `localStorage`, the
 * operating system, and the class on the root element the stylesheet keys off.
 * Every method is inert while prerendering, where none of them exist.
 */
@Injectable({ providedIn: 'root' })
export class ThemeEnvironment {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** The stored choice, or null when there is none to honour. */
  public readChoice(): ThemeChoice | null {
    if (!this.isBrowser) {
      return null;
    }

    // Storage throws rather than returning null when the browser blocks it,
    // and a docs page failing to boot over a colour is not a good trade.
    try {
      const stored: unknown = localStorage.getItem(THEME_STORAGE_KEY);

      return isThemeChoice(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  public writeChoice(choice: ThemeChoice): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      // Reading it back will fall through to the system next time.
    }
  }

  public systemTheme(): Theme {
    if (!this.isBrowser || typeof matchMedia !== 'function') {
      return FALLBACK_THEME;
    }

    return matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark';
  }

  /**
   * Calls back when the operating system changes, so a reader on `system`
   * sees the page follow it without reloading.
   */
  public watchSystem(onChange: (theme: Theme) => void): () => void {
    if (!this.isBrowser || typeof matchMedia !== 'function') {
      return () => undefined;
    }

    const query = matchMedia(LIGHT_QUERY);
    const listener = (event: MediaQueryListEvent): void => {
      onChange(event.matches ? 'light' : 'dark');
    };

    query.addEventListener('change', listener);

    return () => {
      query.removeEventListener('change', listener);
    };
  }

  public apply(theme: Theme): void {
    const root = this.document.documentElement.classList;

    root.remove(...THEME_CLASSES.filter((candidate) => candidate !== theme));
    root.add(theme);
  }
}
