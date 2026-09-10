import { InjectionToken, Injector } from '@angular/core';

import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from '../action';
import { defineUpdater } from './define-updater';
import { indexUpdaters, resolveUpdaters } from './resolve-updaters';

interface CounterState {
  count: number;
}

const FIRST_STATE = new InjectionToken<CounterState>('RESOLVE_FIRST_STATE');
const SECOND_STATE = new InjectionToken<CounterState>('RESOLVE_SECOND_STATE');
const counterActions = defineActionsGroup({
  source: 'resolveProbe',
  events: {
    incremented: payload<number>(),
    reset: emptyPayload,
  },
});
const sharedAction = defineSingleAction('RESOLVE_SHARED', emptyPayload);

function injectorWith(first: CounterState, second: CounterState): Injector {
  return Injector.create({
    providers: [
      { provide: FIRST_STATE, useValue: first },
      { provide: SECOND_STATE, useValue: second },
    ],
  });
}

describe('resolveUpdaters', () => {
  it('reads each state from the injector', () => {
    const first: CounterState = { count: 1 };
    const second: CounterState = { count: 2 };

    const resolved = resolveUpdaters(injectorWith(first, second), [
      defineUpdater(FIRST_STATE, (on) => {
        on(counterActions.incremented, () => undefined);
      }),
      defineUpdater(SECOND_STATE, (on) => {
        on(counterActions.reset, () => undefined);
      }),
    ]);

    expect(resolved.map((updater) => updater.state)).toEqual([first, second]);
  });

  it('resolves nothing when no updater is attached', () => {
    expect(
      resolveUpdaters(injectorWith({ count: 0 }, { count: 0 }), []),
    ).toEqual([]);
  });
});

describe('indexUpdaters', () => {
  it('routes every action type to the updater owning it', () => {
    const first: CounterState = { count: 1 };
    const second: CounterState = { count: 2 };
    const index = indexUpdaters(
      resolveUpdaters(injectorWith(first, second), [
        defineUpdater(FIRST_STATE, (on) => {
          on(counterActions.incremented, () => undefined);
        }),
        defineUpdater(SECOND_STATE, (on) => {
          on(counterActions.reset, () => undefined);
        }),
      ]),
    );

    expect(index.get(counterActions.incremented.type)?.state).toBe(first);
    expect(index.get(counterActions.reset.type)?.state).toBe(second);
    expect(index.get('UNKNOWN')).toBeUndefined();
  });

  it('binds each handler to the state of its own updater', () => {
    const first: CounterState = { count: 1 };
    const second: CounterState = { count: 2 };
    const index = indexUpdaters(
      resolveUpdaters(injectorWith(first, second), [
        defineUpdater(FIRST_STATE, (on) => {
          on(counterActions.incremented, (state, amount) => {
            state.count += amount;
          });
        }),
        defineUpdater(SECOND_STATE, (on) => {
          on(counterActions.reset, (state) => {
            state.count = 0;
          });
        }),
      ]),
    );

    index.get(counterActions.incremented.type)?.apply(4);
    index.get(counterActions.reset.type)?.apply(undefined);

    expect(first.count).toBe(5);
    expect(second.count).toBe(0);
  });

  it('rejects two updaters of one scope claiming the same action type', () => {
    const resolved = resolveUpdaters(injectorWith({ count: 0 }, { count: 0 }), [
      defineUpdater(FIRST_STATE, (on) => {
        on(sharedAction, () => undefined);
      }),
      defineUpdater(SECOND_STATE, (on) => {
        on(sharedAction, () => undefined);
      }),
    ]);

    expect(() => indexUpdaters(resolved)).toThrow(
      /Two updaters attached to the same scope both handle "RESOLVE_SHARED_ACTION"/,
    );
  });

  it('produces an empty index without updaters', () => {
    expect(indexUpdaters([]).size).toBe(0);
  });
});
