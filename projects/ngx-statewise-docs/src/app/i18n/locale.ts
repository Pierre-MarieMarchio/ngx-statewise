import { InjectionToken } from '@angular/core';

export type LocaleCode = 'en' | 'fr';

export interface Locale {
  readonly code: LocaleCode;
  /** Shown in the language switcher, in the language itself. */
  readonly label: string;
  /** Value of the `lang` attribute, and of `hreflang` on the alternates. */
  readonly htmlLang: string;
}

/**
 * Every locale the site is built for, in the order the switcher shows them.
 * The first one is the default: `/` redirects to it, and a page with no
 * translation falls back to it.
 *
 * Adding a locale is an entry here plus the `UI_STRINGS` block for it. Guide
 * pages then translate one file at a time — see `guide-pages.ts`.
 */
export const LOCALES: readonly Locale[] = [
  { code: 'en', label: 'English', htmlLang: 'en' },
  { code: 'fr', label: 'Français', htmlLang: 'fr' },
];

export const DEFAULT_LOCALE = LOCALES[0];

/**
 * The locale of the routes below. Provided by the route wrapping each locale's
 * subtree, so nothing has to derive it from the URL.
 */
export const LOCALE = new InjectionToken<Locale>('docs locale');

export function findLocale(code: string): Locale | undefined {
  return LOCALES.find((locale) => locale.code === code);
}
