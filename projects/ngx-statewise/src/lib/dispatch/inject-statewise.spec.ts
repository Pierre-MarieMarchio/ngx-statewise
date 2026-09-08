import { InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from '../action';
import { provideStatewise } from '../providers/provide-statewise';
import { defineUpdater } from '../updater';
import { injectStatewise } from './inject-statewise';
import type { Statewise } from './statewise-ref';

interface CounterState {
  count: number;
}

const FIRST_STATE = new InjectionToken<CounterState>('INJECT_FIRST_STATE');
const SECOND_STATE = new InjectionToken<CounterState>('INJECT_SECOND_STATE');
const counterActions = defineActionsGroup({
  source: 'injectProbe',
  events: {
    incremented: payload<number>(),
    // Handled by no updater on purpose: an effect-only action stays valid.
    pinged: emptyPayload,
  },
});
const sharedAction = defineSingleAction('INJECT_SHARED', emptyPayload);

const firstUpdater = defineUpdater(FIRST_STATE, (on) => {
  on(counterActions.incremented, (state, amount) => {
    state.count += amount;
  });
});
const secondUpdater = defineUpdater(SECOND_STATE, (on) => {
  on(counterActions.incremented, (state, amount) => {
    state.count += amount * 10;
  });
});

describe('injectStatewise', () => {
  let first: CounterState;
  let second: CounterState;

  function scope(...updaters: Parameters<typeof injectStatewise>): Statewise {
    return TestBed.runInInjectionContext(() => injectStatewise(...updaters));
  }

  beforeEach(() => {
    first = { count: 0 };
    second = { count: 0 };
    TestBed.configureTestingModule({
      providers: [
        provideStatewise(),
        { provide: FIRST_STATE, useFactory: () => first },
        { provide: SECOND_STATE, useFactory: () => second },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('refuses to run outside an injection context', () => {
    expect(() => injectStatewise()).toThrow(/injection context/i);
  });

  it('returns a usable handle even without updater', () => {
    const statewise = scope();

    expect(() => {
      statewise.dispatch(counterActions.pinged());
    }).not.toThrow();
  });

  it('binds the updater to the state read from the injector', async () => {
    const statewise = scope(firstUpdater);

    await statewise.dispatchAsync(counterActions.incremented(3));

    expect(first.count).toBe(3);
  });

  it('keeps two scopes isolated for the same action type', async () => {
    const firstStatewise = scope(firstUpdater);
    const secondStatewise = scope(secondUpdater);

    await firstStatewise.dispatchAsync(counterActions.incremented(1));

    expect(first.count).toBe(1);
    expect(second.count).toBe(0);

    await secondStatewise.dispatchAsync(counterActions.incremented(1));

    expect(first.count).toBe(1);
    expect(second.count).toBe(10);
  });

  it('rejects two updaters of one scope claiming the same action type', () => {
    expect(() =>
      scope(
        defineUpdater(FIRST_STATE, (on) => {
          on(sharedAction, () => undefined);
        }),
        defineUpdater(SECOND_STATE, (on) => {
          on(sharedAction, () => undefined);
        }),
      ),
    ).toThrow(
      /Two updaters attached to the same scope both handle "INJECT_SHARED_ACTION"/,
    );
  });
});
