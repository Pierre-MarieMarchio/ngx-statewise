import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';

import {
  createEffect,
  defineActionsGroup,
  defineSingleAction,
  dispatchAsync,
  emptyPayload,
  IUpdator,
  ofType,
  payload,
  provideEffects,
  provideStatewise,
  registerLocalUpdator,
  UpdatorRegistry,
  waitForAllEffects,
} from '../public-api';

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

const effectOnlyAction = defineSingleAction('EFFECT_ONLY', payload<number>());
const emptyObservableAction = defineSingleAction(
  'EMPTY_OBSERVABLE',
  emptyPayload
);
const failingAction = defineSingleAction('FAILING_EFFECT', emptyPayload);
const failingUpdatorAction = defineSingleAction('FAILING_UPDATOR', emptyPayload);
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

let effectOnlyStarted: Deferred<void>;
let effectOnlyGate: Deferred<void>;
let cascadeFirstStarted: Deferred<void>;
let cascadeSecondStarted: Deferred<void>;
let cascadeFirstGate: Deferred<void>;
let cascadeSecondGate: Deferred<void>;
let cascadeFirstFinished: Deferred<void>;
let concurrentGates: Map<string, Deferred<void>>;
let concurrentStarted: Map<string, Deferred<void>>;

@Injectable()
class EffectOnlyEffects {
  private readonly effect = createEffect(effectOnlyAction.action, async () => {
    effectOnlyStarted.resolve();
    await effectOnlyGate.promise;
  });
}

@Injectable()
class FailingEffects {
  private readonly effect = createEffect(failingAction.action, () => {
    throw new Error('unexpected effect failure');
  });
}

@Injectable()
class EmptyObservableEffects {
  private readonly effect = createEffect(
    emptyObservableAction.action,
    () => EMPTY
  );
}

@Injectable()
class CascadeEffects {
  private readonly parent = createEffect(cascadeActions.started, (value) =>
    cascadeActions.child(value)
  );

  private readonly firstChild = createEffect(
    cascadeActions.child,
    async () => {
      cascadeFirstStarted.resolve();
      await cascadeFirstGate.promise;
      cascadeFirstFinished.resolve();
    }
  );

  private readonly secondChild = createEffect(
    cascadeActions.child,
    async () => {
      cascadeSecondStarted.resolve();
      await cascadeSecondGate.promise;
    }
  );
}

@Injectable()
class ConcurrentEffects {
  private readonly effect = createEffect(
    concurrentActions.started,
    async (value) => {
      concurrentStarted.get(value)?.resolve();
      await concurrentGates.get(value)?.promise;
      return concurrentActions.completed(value);
    }
  );
}

interface ConcurrentState {
  completed: string[];
}

class ConcurrentUpdator implements IUpdator<ConcurrentState> {
  public readonly state: ConcurrentState = { completed: [] };

  public readonly updators: UpdatorRegistry<ConcurrentState> = {
    [ofType(concurrentActions.completed)]: (state, value) => {
      state.completed.push(value as string);
    },
  };
}

class FailingUpdator implements IUpdator<object> {
  public readonly state = {};

  public readonly updators: UpdatorRegistry<object> = {
    [ofType(failingUpdatorAction.action)]: () => {
      throw new Error('unexpected updator failure');
    },
  };
}

describe('public execution contract', () => {
  beforeEach(() => {
    effectOnlyStarted = deferred<void>();
    effectOnlyGate = deferred<void>();
    cascadeFirstStarted = deferred<void>();
    cascadeSecondStarted = deferred<void>();
    cascadeFirstGate = deferred<void>();
    cascadeSecondGate = deferred<void>();
    cascadeFirstFinished = deferred<void>();
    concurrentGates = new Map();
    concurrentStarted = new Map();

    TestBed.configureTestingModule({
      providers: [
        provideStatewise(),
        provideEffects([
          EffectOnlyEffects,
          EmptyObservableEffects,
          FailingEffects,
          CascadeEffects,
          ConcurrentEffects,
        ]),
      ],
    });

    TestBed.inject(EffectOnlyEffects);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('waits for an action handled only by an effect', async () => {
    let settled = false;
    const execution = dispatchAsync(effectOnlyAction.action(42)).then(() => {
      settled = true;
    });

    await effectOnlyStarted.promise;
    expect(settled).toBeFalse();

    effectOnlyGate.resolve();
    await execution;

    expect(settled).toBeTrue();
  });

  it('treats an empty one-shot Observable as an effect without a result', async () => {
    await expectAsync(
      dispatchAsync(emptyObservableAction.action())
    ).toBeResolved();
  });

  it('waits for every effect attached to a cascading sub-action', async () => {
    let settled = false;
    const execution = dispatchAsync(cascadeActions.started('payload')).then(
      () => {
        settled = true;
      }
    );

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
    await expectAsync(dispatchAsync(failingAction.action())).toBeRejectedWithError(
      'unexpected effect failure'
    );

    await expectAsync(waitForAllEffects()).toBeResolved();
  });

  it('rejects dispatchAsync when an updator fails unexpectedly', async () => {
    await expectAsync(
      dispatchAsync(failingUpdatorAction.action(), new FailingUpdator())
    ).toBeRejectedWithError('unexpected updator failure');
  });

  it('isolates local contexts for concurrent dispatches of the same action type', async () => {
    const firstManager = {};
    const secondManager = {};
    const firstUpdator = new ConcurrentUpdator();
    const secondUpdator = new ConcurrentUpdator();
    const firstStarted = deferred<void>();
    const secondStarted = deferred<void>();
    const firstGate = deferred<void>();
    const secondGate = deferred<void>();

    concurrentStarted.set('first', firstStarted);
    concurrentStarted.set('second', secondStarted);
    concurrentGates.set('first', firstGate);
    concurrentGates.set('second', secondGate);

    registerLocalUpdator(firstManager, firstUpdator);
    registerLocalUpdator(secondManager, secondUpdator);

    const firstExecution = dispatchAsync(
      concurrentActions.started('first'),
      firstManager
    );
    await firstStarted.promise;

    const secondExecution = dispatchAsync(
      concurrentActions.started('second'),
      secondManager
    );
    await secondStarted.promise;

    secondGate.resolve();
    firstGate.resolve();
    await Promise.all([firstExecution, secondExecution]);

    expect(firstUpdator.state.completed).toEqual(['first']);
    expect(secondUpdator.state.completed).toEqual(['second']);
  });
});
