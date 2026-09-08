import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideStatewise } from 'ngx-statewise';
import { routes } from './app.routes';
import { DocsUiEffect, DocsUiManager, docsUiUpdater } from './ui-state';

/**
 * No `provideZoneChangeDetection` and no `zone.js` polyfill: the application is
 * zoneless, which is the default from Angular 21 onwards.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      // Binds each guide route's `data.page` to the page component's input.
      withComponentInputBinding(),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
      // A crossfade rather than each page fading in over a blank frame. The
      // first render is skipped: a prerendered page is already there, and
      // animating it in would undo the point of prerendering it.
      withViewTransitions({ skipInitialTransition: true }),
    ),
    // The pages are prerendered; hydration adopts that markup instead of
    // throwing it away and rendering the same thing again.
    provideClientHydration(),
    provideStatewise({
      effects: [DocsUiEffect],
      updaters: [docsUiUpdater],
    }),
    provideAppInitializer(() => {
      inject(DocsUiManager).start();
    }),
  ],
};
