/** What the reader picked. `system` defers to the operating system. */
export type ThemeChoice = 'light' | 'dark' | 'system';

/** What is actually painted, once `system` has been resolved. */
export type Theme = 'light' | 'dark';

export const THEME_CHOICES: readonly ThemeChoice[] = [
  'light',
  'dark',
  'system',
];

export const DEFAULT_THEME_CHOICE: ThemeChoice = 'system';

/** Used when the system cannot be asked, as when prerendering. */
export const FALLBACK_THEME: Theme = 'dark';

/**
 * Shared with the inline script in `index.html`, which resolves the theme
 * before Angular boots so a reload does not flash the other one.
 */
export const THEME_STORAGE_KEY = 'ngx-statewise-docs-theme';

/** The classes the stylesheet keys off, on the root element. */
export const THEME_CLASSES: readonly Theme[] = ['light', 'dark'];

export const LIGHT_QUERY = '(prefers-color-scheme: light)';

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === 'light' || value === 'dark' || value === 'system';
}
