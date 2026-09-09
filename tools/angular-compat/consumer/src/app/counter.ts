import { Injectable, signal } from '@angular/core';
import {
  defineActionsGroup,
  defineUpdater,
  emptyPayload,
  payload,
} from 'ngx-statewise';

/**
 * One vertical slice of a real consumer: actions, the state they land in, and
 * the updater binding the two. Everything here is written the way the README
 * tells a user to write it, so a break in the published contract shows up as
 * a compile error in this file rather than as a subtlety no one reads.
 */
export const counterActions = defineActionsGroup({
  source: 'Counter',
  events: {
    incremented: payload<number>(),
    doubled: emptyPayload,
    reset: emptyPayload,
  },
});

@Injectable({ providedIn: 'root' })
export class CounterState {
  public readonly value = signal(0);
}

export const counterUpdater = defineUpdater(CounterState, (on) => {
  on(counterActions.incremented, (state, by) => {
    state.value.update((current) => current + by);
  });

  on(counterActions.doubled, (state) => {
    state.value.update((current) => current * 2);
  });

  on(counterActions.reset, (state) => {
    state.value.set(0);
  });
});
