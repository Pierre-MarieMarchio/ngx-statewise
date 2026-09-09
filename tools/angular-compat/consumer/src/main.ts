import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideStatewise } from 'ngx-statewise';

import { AppComponent } from './app/app.component';
import { CounterEffects } from './app/counter.effects';

/**
 * Bootstraps the way the README tells a consumer to bootstrap. Building this
 * file ahead of time is what proves the published `.d.ts` and the published
 * `.mjs` both agree with this Angular major.
 */
void bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideStatewise({
      effects: [CounterEffects],
      history: { limit: 50 },
    }),
  ],
});
