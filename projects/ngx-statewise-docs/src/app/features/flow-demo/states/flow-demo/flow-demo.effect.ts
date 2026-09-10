import { Injectable, InjectionToken, inject } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { demoLoginActions } from './flow-demo.action';
import { FlowDemoState } from './flow-demo.state';

/**
 * How long the pretend request takes. Long enough to watch, short enough not
 * to be a wait. Injected so a test can set it to nothing.
 */
export const DEMO_LATENCY_MS = new InjectionToken<number>('DEMO_LATENCY_MS', {
  providedIn: 'root',
  factory: () => 900,
});

@Injectable({ providedIn: 'root' })
export class FlowDemoEffect {
  private readonly state = inject(FlowDemoState);
  private readonly latency = inject(DEMO_LATENCY_MS);

  /**
   * The asynchronous half. It reads `isLoading` only to prove the point the
   * page is making: the updater has already run by the time this starts, so
   * the flag is true here without this effect having set it.
   */
  public readonly loginEffect = createEffect(
    demoLoginActions.request,
    async () => {
      const alreadyWritten = this.state.isLoading();

      await new Promise((resolve) => setTimeout(resolve, this.latency));

      return demoLoginActions.success({
        user: alreadyWritten ? 'ada@example.com' : 'unreachable',
      });
    },
  );
}
