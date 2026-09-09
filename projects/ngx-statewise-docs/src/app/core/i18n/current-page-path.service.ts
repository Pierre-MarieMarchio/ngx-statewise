import { Injectable, signal } from '@angular/core';

/**
 * The path of the page being shown, after its locale segment — `''` for the
 * landing page, `guide/effects` for a guide page.
 *
 * The shell needs it to point the language switcher and the `hreflang`
 * alternates at the *same* page in another locale, and `Router.url` is a
 * getter, not a signal: read from the shell it would never update after a
 * client-side navigation. Each page declares its own identity here instead.
 */
@Injectable({ providedIn: 'root' })
export class CurrentPagePath {
  public readonly path = signal('');
}
