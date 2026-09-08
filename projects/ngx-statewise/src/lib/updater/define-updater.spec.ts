import { InjectionToken } from '@angular/core';

import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from '../action';
import { defineUpdater } from './define-updater';

interface CounterState {
  count: number;
}

const COUNTER_STATE = new InjectionToken<CounterState>('DEFINE_COUNTER_STATE');
const counterActions = defineActionsGroup({
  source: 'defineProbe',
  events: {
    incremented: payload<number>(),
    reset: emptyPayload,
  },
});
const mappedAction = defineSingleAction('DEFINE_MAPPED', (raw: string) =>
  Number(raw),
);

describe('defineUpdater', () => {
  it('keeps the state token it was declared with', () => {
    const updater = defineUpdater(COUNTER_STATE, () => undefined);

    expect(updater.stateToken).toBe(COUNTER_STATE);
    expect(updater.handlers.size).toBe(0);
  });

  it('indexes one handler per action type', () => {
    const updater = defineUpdater(COUNTER_STATE, (on) => {
      on(counterActions.incremented, () => undefined);
      on(counterActions.reset, () => undefined);
      on(mappedAction, () => undefined);
    });

    expect([...updater.handlers.keys()]).toEqual([
      'DEFINEPROBE_INCREMENTED',
      'DEFINEPROBE_RESET',
      'DEFINE_MAPPED_ACTION',
    ]);
  });

  it('applies the payload of the dispatched action to the state', () => {
    const updater = defineUpdater(COUNTER_STATE, (on) => {
      on(counterActions.incremented, (state, amount) => {
        state.count += amount;
      });
      on(counterActions.reset, (state) => {
        state.count = 0;
      });
    });
    const state: CounterState = { count: 1 };

    updater.handlers.get(counterActions.incremented.type)?.update(state, 2);
    expect(state.count).toBe(3);

    updater.handlers.get(counterActions.reset.type)?.update(state, undefined);
    expect(state.count).toBe(0);
  });

  it('rejects the same action type declared twice in one updater', () => {
    expect(() =>
      defineUpdater(COUNTER_STATE, (on) => {
        on(counterActions.reset, () => undefined);
        on(counterActions.reset, () => undefined);
      }),
    ).toThrow(
      /Duplicate handler for action type "DEFINEPROBE_RESET" in a single updater/,
    );
  });
});
