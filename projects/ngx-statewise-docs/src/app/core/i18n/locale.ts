import { InjectionToken } from '@angular/core';

export type LocaleCode = 'en' | 'fr';

export interface Locale {
  readonly code: LocaleCode;
  /** The language's own name, used as the accessible name of its button. */
  readonly label: string;
  /**
   * What the switcher actually prints. Language names side by side are wider
   * than the navigation column; codes are not.
   */
  readonly short: string;
  /** Value of the `lang` attribute, and of `hreflang` on the alternates. */
  readonly htmlLang: string;
}

/**
 * Every locale the site is built for, in the order the switcher shows them.
 * The first one is the default: `/` redirects to it, and a page with no
 * translation falls back to it.
 *
 * Adding a locale is an entry here plus a file under `strings/`. Both are
 * written by someone who speaks the language, which is what limits the list to
 * two.
 *
 * The guide itself stays in English. Sixteen pages retranslated on every API
 * change is not maintainable by one person, and the untranslated banner says
 * so on every page. Only the interface is localised.
 */
/* A non-empty tuple, so "the first one is the default" is something the type
   guarantees rather than something this comment promises. */
export const LOCALES: readonly [Locale, ...Locale[]] = [
  { code: 'en', label: 'English', short: 'EN', htmlLang: 'en' },
  { code: 'fr', label: 'Français', short: 'FR', htmlLang: 'fr' },
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
