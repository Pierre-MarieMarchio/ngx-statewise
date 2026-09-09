import {
  createEnvironmentInjector,
  EnvironmentInjector,
  ErrorHandler,
  Injectable,
  InjectionToken,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { defineActionsGroup, emptyPayload, payload } from '../action';
import { ActionHistory } from '../dispatch/action-history';
import type { DispatchScope } from '../dispatch/dispatch-scope';
import { StatewiseEngine } from '../dispatch/statewise-engine';
import { createEffect } from '../effect';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import { defineUpdater } from '../updater';
import { DUPLICATE_PROVIDER_REACTION } from './duplicate-provider';
import { provideStatewise } from './provide-statewise';

interface CounterState {
  count: number;
}

interface OrderedState {
  log: string[];
}

const COUNTER_STATE = new InjectionToken<CounterState>('COUNTER_STATE');
const ORDERED_STATE = new InjectionToken<OrderedState>('ORDERED_STATE');
const provideActions = defineActionsGroup({
  source: 'provideProbe',
  events: {
    // Handled by counterUpdater below.
    incremented: payload<number>(),
    // Handled by orderedUpdater below.
    appended: payload<string>(),
    // Deliberately handled by no updater: effect-only actions stay valid.
    pinged: payload<number>(),
    ponged: emptyPayload,
    // Two effects returning each other's action: the cascade never ends.
    looped: emptyPayload,
    bounced: emptyPayload,
  },
});

const counterUpdater = defineUpdater(COUNTER_STATE, (on) => {
  on(provideActions.incremented, (state, amount) => {
    state.count += amount;
  });
});

const orderedUpdater = defineUpdater(ORDERED_STATE, (on) => {
  on(provideActions.appended, (state, value) => {
    state.log.push(value);
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

@Injectable()
class CycleEffect {
  private readonly onLoop = createEffect(provideActions.looped, () =>
    provideActions.bounced(),
  );

  private readonly onBounce = createEffect(provideActions.bounced, () =>
    provideActions.looped(),
  );
}

/**
 * The class a lazy route would provide alongside a second `provideStatewise()`
 * — the shape the guide used to recommend without saying what the second call
 * costs.
 */
@Injectable()
class LazyRouteEffect {
  private readonly onPing = createEffect(provideActions.pinged, (amount) => {
    effectRuns.push(amount);
  });
}

describe('provideStatewise', () => {
  let state: CounterState;
  let ordered: OrderedState;
  let handledErrors: unknown[];

  function configure(...providers: unknown[]): void {
    TestBed.configureTestingModule({
      providers: [
        ...(providers as never[]),
        { provide: COUNTER_STATE, useFactory: () => state },
        { provide: ORDERED_STATE, useFactory: () => ordered },
        {
          provide: ErrorHandler,
          useValue: {
            handleError: (error: unknown) => handledErrors.push(error),
          },
        },
      ],
    });
  }

  beforeEach(() => {
    state = { count: 0 };
    ordered = { log: [] };
    effectRuns = [];
    handledErrors = [];
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

  /*
   * A global updater is the one case where two dispatch scopes reach the same
   * state, so scope isolation cannot be what keeps their dispatches ordered.
   * Only the synchronous updater does. Gate it.
   */
  it('applies the dispatches of two scopes to one global state in order', async () => {
    configure(provideStatewise({ updaters: [orderedUpdater] }));
    const engine = TestBed.inject(StatewiseEngine);
    const firstScope: DispatchScope = { updaters: new Map() };
    const secondScope: DispatchScope = { updaters: new Map() };

    await Promise.all([
      engine.execute(provideActions.appended('first'), firstScope),
      engine.execute(provideActions.appended('second'), secondScope),
    ]);

    expect(ordered.log).toEqual(['first', 'second']);
  });

  describe('misrouted dispatch', () => {
    function misroute(): Promise<void> {
      return Promise.resolve().then(() =>
        TestBed.inject(StatewiseEngine).execute(
          provideActions.incremented(1),
          NO_SCOPE,
        ),
      );
    }

    it('throws in dev mode, which is the default reaction', async () => {
      configure(provideStatewise());

      await expect(misroute()).rejects.toThrow(
        /No updater in scope for "PROVIDEPROBE_INCREMENTED"/,
      );
    });

    it('reports to the ErrorHandler when asked to', async () => {
      configure(provideStatewise({ misroutedDispatch: 'report' }));

      await expect(misroute()).resolves.not.toThrow();

      expect(handledErrors.length).toBe(1);
      expect((handledErrors[0] as Error).message).toMatch(
        /No updater in scope for "PROVIDEPROBE_INCREMENTED"/,
      );
    });

    it('says nothing at all when asked to ignore it', async () => {
      configure(provideStatewise({ misroutedDispatch: 'ignore' }));

      await expect(misroute()).resolves.not.toThrow();

      expect(handledErrors).toEqual([]);
      expect(state.count).toBe(0);
    });
  });

  describe('history', () => {
    it('is disabled unless it is configured', async () => {
      configure(provideStatewise());
      const engine = TestBed.inject(StatewiseEngine);

      await engine.execute(provideActions.ponged(), NO_SCOPE);

      expect(TestBed.inject(ActionHistory).snapshot()).toEqual([]);
    });

    it('retains the latest actions up to the configured limit', async () => {
      configure(provideStatewise({ history: { limit: 1 } }));
      const engine = TestBed.inject(StatewiseEngine);

      await engine.execute(provideActions.ponged(), NO_SCOPE);
      await engine.execute(provideActions.pinged(1), NO_SCOPE);

      expect(TestBed.inject(ActionHistory).snapshot()).toEqual([
        provideActions.pinged(1),
      ]);
    });

    it('requires a positive integer limit', () => {
      const message =
        '[ngx-statewise] history.limit must be a positive integer.';

      expect(() => provideStatewise({ history: { limit: 0 } })).toThrow(
        message,
      );
      expect(() => provideStatewise({ history: { limit: -1 } })).toThrow(
        message,
      );
      expect(() => provideStatewise({ history: { limit: 1.5 } })).toThrow(
        message,
      );
      expect(() =>
        provideStatewise({ history: { limit: Number.NaN } }),
      ).toThrow(message);
    });

    it('accepts a valid limit', () => {
      expect(() => provideStatewise({ history: { limit: 10 } })).not.toThrow();
    });
  });

  describe('cascade bound', () => {
    function configureCycle(maxCascadeDepth?: number): StatewiseEngine {
      configure(provideStatewise({ effects: [CycleEffect], maxCascadeDepth }));

      return TestBed.inject(StatewiseEngine);
    }

    it('stops an endless cascade on the default bound', async () => {
      await expect(
        configureCycle().execute(provideActions.looped(), NO_SCOPE),
      ).rejects.toThrow(
        /PROVIDEPROBE_LOOPED → PROVIDEPROBE_BOUNCED → PROVIDEPROBE_LOOPED/,
      );
    });

    it('applies the bound the application configured', async () => {
      await expect(
        configureCycle(1).execute(provideActions.looped(), NO_SCOPE),
      ).rejects.toThrow('exceeded maxCascadeDepth (1)');
    });

    it('requires a positive integer bound', () => {
      const message =
        '[ngx-statewise] maxCascadeDepth must be a positive integer.';

      expect(() => provideStatewise({ maxCascadeDepth: 0 })).toThrow(message);
      expect(() => provideStatewise({ maxCascadeDepth: -1 })).toThrow(message);
      expect(() => provideStatewise({ maxCascadeDepth: 1.5 })).toThrow(message);
      expect(() => provideStatewise({ maxCascadeDepth: Number.NaN })).toThrow(
        message,
      );
    });

    it('accepts a valid bound', () => {
      expect(() => provideStatewise({ maxCascadeDepth: 10 })).not.toThrow();
    });
  });

  /**
   * The quietest trap the library had. A second call builds a second effect
   * registry, invisible to the root engine, so the effects declared with it
   * never run — while their updaters still apply, which makes the action look
   * like it worked.
   */
  describe('a second provideStatewise', () => {
    /** What the providers of a lazy route amount to: a child environment. */
    function inLazyRoute(reaction?: 'report'): () => EnvironmentInjector {
      const providers =
        reaction === undefined
          ? [provideStatewise({ effects: [LazyRouteEffect] })]
          : [
              provideStatewise({ effects: [LazyRouteEffect] }),
              // Provided after provideStatewise, so this value wins — the
              // same trick provideStatewiseTesting uses for the misrouted
              // reaction. A TestBed always runs in dev mode, so this is the
              // only way to reach the production arm.
              { provide: DUPLICATE_PROVIDER_REACTION, useValue: reaction },
            ];

      return () =>
        createEnvironmentInjector(
          providers,
          TestBed.inject(EnvironmentInjector),
        );
    }

    it('says nothing about a single call', () => {
      configure(provideStatewise({ effects: [CounterEffect] }));

      expect(() => TestBed.inject(StatewiseEngine)).not.toThrow();
      expect(handledErrors).toEqual([]);
    });

    it('throws in dev mode, which is the default reaction', () => {
      configure(provideStatewise());

      expect(inLazyRoute()).toThrow(
        /provideStatewise\(\) has already been called by a parent injector/,
      );
    });

    it('reports to the ErrorHandler in production', () => {
      configure(provideStatewise());

      expect(inLazyRoute('report')).not.toThrow();

      expect(handledErrors.length).toBe(1);
      expect((handledErrors[0] as Error).message).toMatch(
        /provideStatewise\(\) has already been called by a parent injector/,
      );
    });
  });
});
