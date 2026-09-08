import { ErrorHandler, Injectable, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';

import {
  createEffect,
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
    expect(settled).toBeFalse();

    effectOnlyGate.resolve();
    await execution;

    expect(settled).toBeTrue();
  });

  it('treats an empty one-shot Observable as a result without action', async () => {
    await expectAsync(
      statewise.dispatchAsync(emptyObservableAction()),
    ).toBeResolved();
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
    expect(settled).toBeFalse();

    cascadeSecondGate.resolve();
    await execution;

    expect(settled).toBeTrue();
  });

  it('rejects dispatchAsync when an effect fails unexpectedly', async () => {
    await expectAsync(
      statewise.dispatchAsync(failingEffectAction()),
    ).toBeRejectedWithError('unexpected effect failure');

    await expectAsync(statewise.waitForAllEffects()).toBeResolved();
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

  it('rejects dispatchAsync when an updater fails unexpectedly', async () => {
    const failing = manager(failingUpdater);

    await expectAsync(
      failing.dispatchAsync(failingUpdaterAction()),
    ).toBeRejectedWithError('unexpected updater failure');
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

      await expectAsync(
        stranger.dispatchAsync(scopedActions.requested('leaked')),
      ).toBeRejectedWithError(/No updater in scope for "SCOPED_REQUESTED"/);

      // The effect never ran, so nothing cascaded into the wrong scope.
      expect(scopedEffectRuns).toEqual([]);
      expect(firstState.completed).toEqual([]);
      expect(secondState.completed).toEqual([]);
    });

    it('keeps running them for an action no updater claims', async () => {
      await expectAsync(
        statewise.dispatchAsync(emptyObservableAction()),
      ).toBeResolved();
    });
  });

  /*
   * What these defend: an updater is applied synchronously, inside `dispatch`,
   * before anything is awaited. Nothing else in the suite asserts it, so any
   * change putting an awaited step in front of the updater would pass
   * unnoticed.
   *
   * The first and the last are real gates — verified by inserting one awaited
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
      expect(waited).toBeFalse();

      effectOnlyGate.resolve();
      await waiting;
      expect(waited).toBeTrue();
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
