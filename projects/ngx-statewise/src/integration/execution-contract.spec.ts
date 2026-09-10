import { ErrorHandler, Injectable, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, of } from 'rxjs';

import {
  createEffect,
  createInterceptor,
  defineActionsGroup,
  defineSingleAction,
  defineUpdater,
  emptyPayload,
  injectStatewise,
  payload,
  provideStatewise,
  type Statewise,
} from '../public-api';

interface Deferred {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  const promise = new Promise<void>((settle) => {
    resolve = () => {
      settle();
    };
  });

  return { promise, resolve };
}

interface CompletionState {
  completed: string[];
}

const FIRST_STATE = new InjectionToken<CompletionState>('FIRST_STATE');
const SECOND_STATE = new InjectionToken<CompletionState>('SECOND_STATE');

const effectOnlyAction = defineSingleAction('EFFECT_ONLY', payload<number>());
const emptyObservableAction = defineSingleAction(
  'EMPTY_OBSERVABLE',
  emptyPayload,
);
const failingEffectAction = defineSingleAction('FAILING_EFFECT', emptyPayload);
const unansweredAction = defineSingleAction('UNANSWERED', emptyPayload);
const answeringAction = defineSingleAction('ANSWERING', emptyPayload);
/** Claimed by no updater and reacted to by no effect: it does nothing at all. */
const inertAction = defineSingleAction('INERT', emptyPayload);
const failingUpdaterAction = defineSingleAction(
  'FAILING_UPDATER',
  emptyPayload,
);
const cascadeActions = defineActionsGroup({
  source: 'Cascade',
  events: {
    started: payload<string>(),
    child: payload<string>(),
  },
});
const concurrentActions = defineActionsGroup({
  source: 'Concurrent',
  events: {
    started: payload<string>(),
    completed: payload<string>(),
  },
});
const scopedActions = defineActionsGroup({
  source: 'Scoped',
  events: {
    requested: payload<string>(),
    applied: payload<string>(),
  },
});
const orderedActions = defineActionsGroup({
  source: 'Ordered',
  events: { appended: payload<string>() },
});
/** Guarded by an interceptor refusing the payload `'refused'`. */
const guardedActions = defineActionsGroup({
  source: 'Guarded',
  events: { requested: payload<string>() },
});
/** Two effects returning each other's action: the cascade never ends. */
const cycleActions = defineActionsGroup({
  source: 'Cycle',
  events: { pinged: emptyPayload, ponged: emptyPayload },
});

let effectOnlyStarted: Deferred;
let effectOnlyGate: Deferred;
let cascadeFirstStarted: Deferred;
let cascadeSecondStarted: Deferred;
let cascadeFirstGate: Deferred;
let cascadeSecondGate: Deferred;
let cascadeFirstFinished: Deferred;
let concurrentStarted: Map<string, Deferred>;
let concurrentGates: Map<string, Deferred>;
let scopedEffectRuns: string[];
let guardedEffectRuns: string[];

@Injectable()
class ContractEffects {
  private readonly effectOnly = createEffect(effectOnlyAction, async () => {
    effectOnlyStarted.resolve();
    await effectOnlyGate.promise;
  });

  private readonly emptyObservable = createEffect(
    emptyObservableAction,
    () => EMPTY,
  );

  private readonly failing = createEffect(failingEffectAction, () => {
    throw new Error('unexpected effect failure');
  });

  private readonly unanswered = createEffect(unansweredAction, () => EMPTY, {
    mustAnswer: true,
  });

  private readonly answering = createEffect(
    answeringAction,
    () => of(inertAction()),
    { mustAnswer: true },
  );

  private readonly cascadeParent = createEffect(
    cascadeActions.started,
    (value) => cascadeActions.child(value),
  );

  private readonly cascadeFirstChild = createEffect(
    cascadeActions.child,
    async () => {
      cascadeFirstStarted.resolve();
      await cascadeFirstGate.promise;
      cascadeFirstFinished.resolve();
    },
  );

  private readonly cascadeSecondChild = createEffect(
    cascadeActions.child,
    async () => {
      cascadeSecondStarted.resolve();
      await cascadeSecondGate.promise;
    },
  );

  private readonly scoped = createEffect(scopedActions.requested, (value) => {
    scopedEffectRuns.push(value);

    return scopedActions.applied(value);
  });

  private readonly guarded = createEffect(guardedActions.requested, (value) => {
    guardedEffectRuns.push(value);
  });

  /**
   * Declared beside the effects, in the same injection context: an
   * interceptor needs one, and nothing more.
   */
  private readonly guard = createInterceptor(
    guardedActions.requested,
    (value) => value !== 'refused',
  );

  private readonly cyclePing = createEffect(cycleActions.pinged, () =>
    cycleActions.ponged(),
  );

  private readonly cyclePong = createEffect(cycleActions.ponged, () =>
    cycleActions.pinged(),
  );

  private readonly concurrent = createEffect(
    concurrentActions.started,
    async (value) => {
      concurrentStarted.get(value)?.resolve();
      await concurrentGates.get(value)?.promise;

      return concurrentActions.completed(value);
    },
  );
}

function completionUpdater(token: InjectionToken<CompletionState>) {
  return defineUpdater(token, (on) => {
    on(concurrentActions.completed, (state, value) => {
      state.completed.push(value);
    });
  });
}

const scopedUpdater = defineUpdater(FIRST_STATE, (on) => {
  on(scopedActions.requested, () => undefined);
  on(scopedActions.applied, (state, value) => {
    state.completed.push(value);
  });
});

const failingUpdater = defineUpdater(FIRST_STATE, (on) => {
  on(failingUpdaterAction, () => {
    throw new Error('unexpected updater failure');
  });
});

const guardedUpdater = defineUpdater(FIRST_STATE, (on) => {
  on(guardedActions.requested, (state, value) => {
    state.completed.push(value);
  });
});

const orderedUpdater = defineUpdater(FIRST_STATE, (on) => {
  on(orderedActions.appended, (state, value) => {
    state.completed.push(value);
  });
});

describe('public execution contract', () => {
  let firstState: CompletionState;
  let secondState: CompletionState;
  let handledErrors: unknown[];
  let statewise: Statewise;

  function manager(...updaters: Parameters<typeof injectStatewise>): Statewise {
    return TestBed.runInInjectionContext(() => injectStatewise(...updaters));
  }

  beforeEach(() => {
    effectOnlyStarted = deferred();
    effectOnlyGate = deferred();
    cascadeFirstStarted = deferred();
    cascadeSecondStarted = deferred();
    cascadeFirstGate = deferred();
    cascadeSecondGate = deferred();
    cascadeFirstFinished = deferred();
    concurrentStarted = new Map();
    concurrentGates = new Map();
    scopedEffectRuns = [];
    guardedEffectRuns = [];
    firstState = { completed: [] };
    secondState = { completed: [] };
    handledErrors = [];

    TestBed.configureTestingModule({
      providers: [
        provideStatewise({ effects: [ContractEffects] }),
        { provide: FIRST_STATE, useFactory: () => firstState },
        { provide: SECOND_STATE, useFactory: () => secondState },
        {
          provide: ErrorHandler,
          useValue: {
            handleError: (error: unknown) => handledErrors.push(error),
          },
        },
      ],
    });

    statewise = manager();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('waits for an action handled only by an effect', async () => {
    let settled = false;
    const execution = statewise.dispatchAsync(effectOnlyAction(42)).then(() => {
      settled = true;
    });

    await effectOnlyStarted.promise;
    expect(settled).toBe(false);

    effectOnlyGate.resolve();
    await execution;

    expect(settled).toBe(true);
  });

  it('treats an empty one-shot Observable as a result without action', async () => {
    await expect(
      statewise.dispatchAsync(emptyObservableAction()),
    ).resolves.not.toThrow();
  });

  it('waits for every effect attached to a cascaded action', async () => {
    let settled = false;
    const execution = statewise
      .dispatchAsync(cascadeActions.started('payload'))
      .then(() => {
        settled = true;
      });

    await Promise.all([
      cascadeFirstStarted.promise,
      cascadeSecondStarted.promise,
    ]);

    cascadeFirstGate.resolve();
    await cascadeFirstFinished.promise;
    expect(settled).toBe(false);

    cascadeSecondGate.resolve();
    await execution;

    expect(settled).toBe(true);
  });

  it('rejects dispatchAsync when an effect fails unexpectedly', async () => {
    await expect(
      statewise.dispatchAsync(failingEffectAction()),
    ).rejects.toThrow('unexpected effect failure');

    await expect(statewise.waitForAllEffects()).resolves.not.toThrow();
    expect(handledErrors).toEqual([]);
  });

  it('reports to the ErrorHandler the failure of an effect started by dispatch', async () => {
    statewise.dispatch(failingEffectAction());

    await statewise.waitForAllEffects();
    await Promise.resolve();

    expect(handledErrors.length).toBe(1);
    expect((handledErrors[0] as Error).message).toBe(
      'unexpected effect failure',
    );
  });

  describe('an interceptor refusing an action', () => {
    /**
     * The consequences of a refusal, asserted one at a time: asserting them
     * together would not say which of them holds.
     */
    function refuse(): Promise<void> {
      return manager(guardedUpdater).dispatchAsync(
        guardedActions.requested('refused'),
      );
    }

    it('resolves the dispatch rather than failing it', async () => {
      await expect(refuse()).resolves.not.toThrow();
    });

    it('applies no updater', async () => {
      await refuse();

      expect(firstState.completed).toEqual([]);
    });

    it('starts no effect', async () => {
      await refuse();

      expect(guardedEffectRuns).toEqual([]);
    });

    it('reports nothing to the ErrorHandler', async () => {
      await refuse();

      expect(handledErrors).toEqual([]);
    });

    it('leaves the action it grants entirely untouched', async () => {
      await manager(guardedUpdater).dispatchAsync(
        guardedActions.requested('granted'),
      );

      expect(firstState.completed).toEqual(['granted']);
      expect(guardedEffectRuns).toEqual(['granted']);
    });
  });

  describe('a cascade that never ends', () => {
    it('rejects dispatchAsync instead of exhausting the heap', async () => {
      await expect(
        statewise.dispatchAsync(cycleActions.pinged()),
      ).rejects.toThrow(/exceeded maxCascadeDepth \(50\)/);

      expect(handledErrors).toEqual([]);
    });

    it('names the cycle it stopped', async () => {
      await expect(
        statewise.dispatchAsync(cycleActions.pinged()),
      ).rejects.toThrow(/CYCLE_PINGED → CYCLE_PONGED → CYCLE_PINGED/);
    });

    it('reports it to the ErrorHandler when started by dispatch', async () => {
      statewise.dispatch(cycleActions.pinged());

      await statewise.waitForAllEffects();
      await Promise.resolve();

      expect(handledErrors.length).toBe(1);
      expect((handledErrors[0] as Error).message).toMatch(
        /exceeded maxCascadeDepth/,
      );
    });
  });

  describe('an effect that promises an action', () => {
    it('fails the dispatch when its source answers nothing', async () => {
      await expect(statewise.dispatchAsync(unansweredAction())).rejects.toThrow(
        /declares mustAnswer and produced no action/,
      );
    });

    it('reports that failure to the ErrorHandler for a bare dispatch', async () => {
      statewise.dispatch(unansweredAction());

      await statewise.waitForAllEffects();
      await Promise.resolve();

      expect(handledErrors.length).toBe(1);
    });

    it('says nothing when the source does answer', async () => {
      await expect(
        statewise.dispatchAsync(answeringAction()),
      ).resolves.not.toThrow();
    });

    /**
     * The default is unchanged: answering nothing stays a valid result, which
     * is what an effect performing only a side effect produces.
     */
    it('leaves an effect promising nothing free to answer nothing', async () => {
      await expect(
        statewise.dispatchAsync(emptyObservableAction()),
      ).resolves.not.toThrow();
      expect(handledErrors).toEqual([]);
    });
  });

  it('rejects dispatchAsync when an updater fails unexpectedly', async () => {
    const failing = manager(failingUpdater);

    await expect(failing.dispatchAsync(failingUpdaterAction())).rejects.toThrow(
      'unexpected updater failure',
    );
  });

  describe('effects belong to the manager owning the action', () => {
    it('runs them for the manager that owns the updater', async () => {
      const owner = manager(scopedUpdater);

      await owner.dispatchAsync(scopedActions.requested('kept'));

      expect(scopedEffectRuns).toEqual(['kept']);
      expect(firstState.completed).toEqual(['kept']);
    });

    it('runs none of them for a manager that owns nothing of it', async () => {
      const stranger = manager(completionUpdater(SECOND_STATE));

      await expect(
        stranger.dispatchAsync(scopedActions.requested('leaked')),
      ).rejects.toThrow(/No updater in scope for "SCOPED_REQUESTED"/);

      // The effect never ran, so nothing cascaded into the wrong scope.
      expect(scopedEffectRuns).toEqual([]);
      expect(firstState.completed).toEqual([]);
      expect(secondState.completed).toEqual([]);
    });

    it('keeps running them for an action no updater claims', async () => {
      await expect(
        statewise.dispatchAsync(emptyObservableAction()),
      ).resolves.not.toThrow();
    });
  });

  /*
   * What these defend: an updater is applied synchronously, inside `dispatch`,
   * before anything is awaited. Nothing else in the suite asserts it, so any
   * change putting an awaited step in front of the updater would pass
   * unnoticed.
   *
   * The first and the last are real gates, verified by inserting one awaited
   * step before `applyUpdater`, which turns both red. The two ordering specs
   * are weaker: they hold trivially while the code is synchronous, and a
   * uniform delay in front of every updater keeps them green. Only a delay
   * that varies per dispatch reverses the order, and nothing can produce one
   * today. They record the intended property; strengthen them the day an
   * asynchronous step makes it breakable.
   */
  describe('synchronous state, ordered dispatches', () => {
    it('has applied the updater before dispatch returns', () => {
      const ordered = manager(orderedUpdater);

      ordered.dispatch(orderedActions.appended('now'));

      // No await: the state a component reads in the same tick is already up
      // to date.
      expect(firstState.completed).toEqual(['now']);
    });

    it('applies two dispatches of one action type in dispatch order', () => {
      const ordered = manager(orderedUpdater);

      ordered.dispatch(orderedActions.appended('first'));
      ordered.dispatch(orderedActions.appended('second'));

      expect(firstState.completed).toEqual(['first', 'second']);
    });

    it('keeps that order when neither dispatch is awaited in turn', async () => {
      const ordered = manager(orderedUpdater);

      const first = ordered.dispatchAsync(orderedActions.appended('first'));
      const second = ordered.dispatchAsync(orderedActions.appended('second'));
      await Promise.all([first, second]);

      expect(firstState.completed).toEqual(['first', 'second']);
    });

    it('tracks a fire-and-forget dispatch before it returns', async () => {
      let waited = false;

      statewise.dispatch(effectOnlyAction(1));
      // Called synchronously after dispatch: the effect must already be
      // observable, or an awaiting caller would proceed too early.
      const waiting = statewise.waitForAllEffects().then(() => {
        waited = true;
      });

      await effectOnlyStarted.promise;
      expect(waited).toBe(false);

      effectOnlyGate.resolve();
      await waiting;
      expect(waited).toBe(true);
    });
  });

  it('isolates the scopes of concurrent dispatches of the same action type', async () => {
    const first = manager(completionUpdater(FIRST_STATE));
    const second = manager(completionUpdater(SECOND_STATE));
    const firstStarted = deferred();
    const secondStarted = deferred();
    const firstGate = deferred();
    const secondGate = deferred();

    concurrentStarted.set('first', firstStarted);
    concurrentStarted.set('second', secondStarted);
    concurrentGates.set('first', firstGate);
    concurrentGates.set('second', secondGate);

    const firstExecution = first.dispatchAsync(
      concurrentActions.started('first'),
    );
    await firstStarted.promise;

    const secondExecution = second.dispatchAsync(
      concurrentActions.started('second'),
    );
    await secondStarted.promise;

    secondGate.resolve();
    firstGate.resolve();
    await Promise.all([firstExecution, secondExecution]);

    expect(firstState.completed).toEqual(['first']);
    expect(secondState.completed).toEqual(['second']);
  });
});

const GLOBAL_STATE = new InjectionToken<CompletionState>('GLOBAL_STATE');

const globalActions = defineActionsGroup({
  source: 'Global',
  events: {
    /** Claimed by the global updater alone. */
    noted: payload<string>(),
    /** Claimed by the global updater and by a manager's own updater. */
    shared: payload<string>(),
  },
});

const globalUpdater = defineUpdater(GLOBAL_STATE, (on) => {
  on(globalActions.noted, (state, value) => {
    state.completed.push(`global:${value}`);
  });
  on(globalActions.shared, (state, value) => {
    state.completed.push(`global:${value}`);
  });
});

const shadowingUpdater = defineUpdater(FIRST_STATE, (on) => {
  on(globalActions.shared, (state, value) => {
    state.completed.push(`scoped:${value}`);
  });
});

describe('updaters registered globally', () => {
  let firstState: CompletionState;
  let globalState: CompletionState;

  function manager(...updaters: Parameters<typeof injectStatewise>): Statewise {
    return TestBed.runInInjectionContext(() => injectStatewise(...updaters));
  }

  beforeEach(() => {
    firstState = { completed: [] };
    globalState = { completed: [] };

    TestBed.configureTestingModule({
      providers: [
        provideStatewise({ updaters: [globalUpdater] }),
        { provide: FIRST_STATE, useFactory: () => firstState },
        { provide: GLOBAL_STATE, useFactory: () => globalState },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('answers a handle that owns no updater at all', async () => {
    await manager().dispatchAsync(globalActions.noted('bare'));

    expect(globalState.completed).toEqual(['global:bare']);
  });

  it('answers a manager that owns unrelated updaters', async () => {
    await manager(orderedUpdater).dispatchAsync(globalActions.noted('other'));

    expect(globalState.completed).toEqual(['global:other']);
  });

  it('yields to the updater of a manager claiming the same action type', async () => {
    await manager(shadowingUpdater).dispatchAsync(
      globalActions.shared('claimed'),
    );

    expect(firstState.completed).toEqual(['scoped:claimed']);
    expect(globalState.completed).toEqual([]);
  });

  it('still answers a manager that does not claim that type', async () => {
    await manager(orderedUpdater).dispatchAsync(
      globalActions.shared('unclaimed'),
    );

    expect(globalState.completed).toEqual(['global:unclaimed']);
    expect(firstState.completed).toEqual([]);
  });
});
