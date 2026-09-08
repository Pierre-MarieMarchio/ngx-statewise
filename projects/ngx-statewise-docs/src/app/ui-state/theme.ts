export type Theme = 'dark' | 'light';

export const DEFAULT_THEME: Theme = 'dark';

/**
 * Shared with the inline script in `index.html`, which applies the stored
 * theme before Angular boots so a reload does not flash the other one.
 */
export const THEME_STORAGE_KEY = 'ngx-statewise-docs-theme';

/**
 * `light` and `dark` are the showcase's own theme classes, and what
 * `mat.theme()` scopes its tokens to. They go on `<html>` rather than `<body>`
 * so the inline script in `<head>` can set one before the body exists.
 */
export const THEME_CLASSES: readonly Theme[] = ['dark', 'light'];

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}
