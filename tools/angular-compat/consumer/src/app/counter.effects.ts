import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { createEffect } from 'ngx-statewise';

import { counterActions } from './counter';

/**
 * Covers the three shapes an effect handler may return: nothing, a follow-up
 * action through a Promise, and a one-shot Observable. `createEffect` asserts
 * an injection context, so the class doubles as a check that the published
 * build still runs inside Angular's DI on this major.
 */
@Injectable()
export class CounterEffects {
  public readonly seen: number[] = [];

  private readonly onIncrement = createEffect(
    counterActions.incremented,
    (by) => {
      this.seen.push(by);
    },
  );

  private readonly onDoubleRequested = createEffect(
    counterActions.doubled,
    async () => {
      await Promise.resolve();

      return counterActions.incremented(1);
    },
  );

  private readonly onReset = createEffect(counterActions.reset, () =>
    of(counterActions.incremented(0)),
  );
}
