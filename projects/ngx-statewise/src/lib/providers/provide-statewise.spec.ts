import { Injectable, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { defineActionsGroup, emptyPayload, payload } from '../action';
import type { DispatchScope } from '../dispatch/dispatch-scope';
import { StatewiseEngine } from '../dispatch/statewise-engine';
import { createEffect } from '../effect';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import { defineUpdater } from '../updater';
import { provideStatewise } from './provide-statewise';

interface CounterState {
  count: number;
}

const COUNTER_STATE = new InjectionToken<CounterState>('COUNTER_STATE');
const provideActions = defineActionsGroup({
  source: 'provideProbe',
  events: {
    // Handled by counterUpdater below.
    incremented: payload<number>(),
    // Deliberately handled by no updater: effect-only actions stay valid.
    pinged: payload<number>(),
    ponged: emptyPayload,
  },
});

const counterUpdater = defineUpdater(COUNTER_STATE, (on) => {
  on(provideActions.incremented, (state, amount) => {
    state.count += amount;
  });
});

const NO_SCOPE: DispatchScope = { updaters: new Map() };

let effectRuns: number[];

@Injectable()
class CounterEffect {
  private readonly onPing = createEffect(provideActions.pinged, (amount) => {
    effectRuns.push(amount);
  });
}

describe('provideStatewise', () => {
  let state: CounterState;

  function configure(...providers: unknown[]): void {
    TestBed.configureTestingModule({
      providers: [
        ...(providers as never[]),
        { provide: COUNTER_STATE, useFactory: () => state },
      ],
    });
  }

  beforeEach(() => {
    state = { count: 0 };
    effectRuns = [];
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('provides the engine and its collaborators', () => {
    configure(provideStatewise());

    expect(TestBed.inject(StatewiseEngine)).toBeInstanceOf(StatewiseEngine);
    expect(TestBed.inject(EffectRegistry)).toBeInstanceOf(EffectRegistry);
    expect(TestBed.inject(PendingEffects)).toBeInstanceOf(PendingEffects);
  });

  it('instantiates effect classes eagerly so their effects are registered', async () => {
    configure(provideStatewise({ effects: [CounterEffect] }));

    await TestBed.inject(StatewiseEngine).execute(
      provideActions.pinged(4),
      NO_SCOPE,
    );

    expect(effectRuns).toEqual([4]);
  });

  it('applies the updaters declared globally, without a dispatch scope', async () => {
    configure(provideStatewise({ updaters: [counterUpdater] }));

    await TestBed.inject(StatewiseEngine).execute(
      provideActions.incremented(5),
      NO_SCOPE,
    );

    expect(state.count).toBe(5);
  });

  it('turns the misrouted-dispatch check on in dev mode', async () => {
    configure(provideStatewise());

    await expectAsync(
      Promise.resolve().then(() =>
        TestBed.inject(StatewiseEngine).execute(
          provideActions.incremented(1),
          NO_SCOPE,
        ),
      ),
    ).toBeRejectedWithError(
      /No updater in scope for "PROVIDEPROBE_INCREMENTED"/,
    );
  });

  describe('history', () => {
    it('is disabled unless it is configured', async () => {
      configure(provideStatewise());
      const engine = TestBed.inject(StatewiseEngine);

      await engine.execute(provideActions.ponged(), NO_SCOPE);

      expect(engine.recordedActions()).toEqual([]);
    });

    it('retains the latest actions up to the configured limit', async () => {
      configure(provideStatewise({ history: { limit: 1 } }));
      const engine = TestBed.inject(StatewiseEngine);

      await engine.execute(provideActions.ponged(), NO_SCOPE);
      await engine.execute(provideActions.pinged(1), NO_SCOPE);

      expect(engine.recordedActions()).toEqual([provideActions.pinged(1)]);
    });

    it('requires a positive integer limit', () => {
      const message =
        '[ngx-statewise] history.limit must be a positive integer.';

      expect(() => provideStatewise({ history: { limit: 0 } })).toThrowError(
        message,
      );
      expect(() => provideStatewise({ history: { limit: -1 } })).toThrowError(
        message,
      );
      expect(() => provideStatewise({ history: { limit: 1.5 } })).toThrowError(
        message,
      );
      expect(() =>
        provideStatewise({ history: { limit: Number.NaN } }),
      ).toThrowError(message);
    });

    it('accepts a valid limit', () => {
      expect(() => provideStatewise({ history: { limit: 10 } })).not.toThrow();
    });
  });
});
