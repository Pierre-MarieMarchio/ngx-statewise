export type Theme = 'dark' | 'light';

export const DEFAULT_THEME: Theme = 'dark';

/**
 * Shared with the inline script in `index.html`, which applies the stored
 * theme before Angular boots so a reload does not flash the other one.
 */
export const THEME_STORAGE_KEY = 'ngx-statewise-docs-theme';
export const THEME_ATTRIBUTE = 'data-theme';

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}
