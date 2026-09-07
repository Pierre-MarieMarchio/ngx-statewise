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

let effectOnlyStarted: Deferred;
let effectOnlyGate: Deferred;
let cascadeFirstStarted: Deferred;
let cascadeSecondStarted: Deferred;
let cascadeFirstGate: Deferred;
let cascadeSecondGate: Deferred;
let cascadeFirstFinished: Deferred;
let concurrentStarted: Map<string, Deferred>;
let concurrentGates: Map<string, Deferred>;

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

const failingUpdater = defineUpdater(FIRST_STATE, (on) => {
  on(failingUpdaterAction, () => {
    throw new Error('unexpected updater failure');
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
