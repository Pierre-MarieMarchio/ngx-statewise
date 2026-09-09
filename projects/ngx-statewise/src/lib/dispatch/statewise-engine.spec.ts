import type { ErrorHandler } from '@angular/core';

import type { Action } from '../action';
import { historyEntry } from '../../spec-helpers/history-entry';
import { registeredEffect } from '../../spec-helpers/registered-effect';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import type { RegisteredEffect } from '../effect/registered-effect';
import { RunningEffects } from '../effect/running-effects';
import { InterceptorRegistry } from '../interceptor/interceptor-registry';
import type { RegisteredInterceptor } from '../interceptor/registered-interceptor';
import { declareUpdaterActionTypes } from '../updater/declared-action-types';
import type { StateBoundHandler } from '../updater/updater-definition';
import { ActionHistory, keepAction } from './action-history';
import { DEFAULT_MAX_CASCADE_DEPTH } from './cascade-depth';
import type { DispatchScope } from './dispatch-scope';
import { GlobalUpdaterRegistry } from './global-updater-registry';
import type { MisroutedDispatchReaction } from './misrouted-dispatch';
import { StatewiseEngine } from './statewise-engine';

interface Recorder {
  readonly applied: unknown[];
}

function recordingHandler(recorder: Recorder): StateBoundHandler {
  return {
    state: recorder,
    apply: (payload: unknown): void => {
      recorder.applied.push(payload);
    },
  };
}

function throwingHandler(failure: Error): StateBoundHandler {
  return {
    state: {},
    apply: (): void => {
      throw failure;
    },
  };
}

function scopeOf(...entries: [string, StateBoundHandler][]): DispatchScope {
  return { updaters: new Map(entries) };
}

/**
 * Crosses a macrotask boundary, which drains every microtask behind it.
 *
 * A rejection travelling from one branch up to the caller crosses a number of
 * microtasks nobody should have to count. Waiting for a macrotask instead makes
 * "the failure has had every chance to arrive" an ordering fact rather than a
 * race, and costs no wall-clock time to speak of.
 */
function drainMicrotasks(): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('StatewiseEngine', () => {
  let effects: EffectRegistry;
  let interceptors: InterceptorRegistry;
  let runningEffects: RunningEffects;
  let globalUpdaters: GlobalUpdaterRegistry;
  let pendingEffects: PendingEffects;
  let history: ActionHistory;
  let handledErrors: unknown[];
  let errorHandler: ErrorHandler;
  let engine: StatewiseEngine;
  let emptyScope: DispatchScope;

  function build(
    misroutedDispatch: MisroutedDispatchReaction,
    maxCascadeDepth: number = DEFAULT_MAX_CASCADE_DEPTH,
  ): StatewiseEngine {
    return new StatewiseEngine(
      effects,
      interceptors,
      runningEffects,
      globalUpdaters,
      pendingEffects,
      history,
      errorHandler,
      misroutedDispatch,
      maxCascadeDepth,
    );
  }

  /** Registers a handler as an effect declaring no options. */
  function register(actionType: string, run: RegisteredEffect['run']): void {
    effects.register(actionType, registeredEffect(run));
  }

  /** Registers a handler as an interceptor guarding an action type. */
  function guard(actionType: string, ask: RegisteredInterceptor['ask']): void {
    interceptors.register(actionType, { ask });
  }

  beforeEach(() => {
    effects = new EffectRegistry();
    interceptors = new InterceptorRegistry();
    runningEffects = new RunningEffects();
    globalUpdaters = new GlobalUpdaterRegistry();
    pendingEffects = new PendingEffects();
    history = new ActionHistory(10, keepAction);
    handledErrors = [];
    errorHandler = {
      handleError: (error: unknown): void => {
        handledErrors.push(error);
      },
    };
    engine = build('ignore');
    emptyScope = scopeOf();
  });

  describe('state update', () => {
    it('applies the handler of the dispatch scope', async () => {
      const recorder: Recorder = { applied: [] };

      await engine.execute(
        { type: 'SCOPED', payload: 1 },
        scopeOf(['SCOPED', recordingHandler(recorder)]),
      );

      expect(recorder.applied).toEqual([1]);
    });

    it('falls back to the global handler when the scope has none', async () => {
      const recorder: Recorder = { applied: [] };
      globalUpdaters.set(new Map([['GLOBAL', recordingHandler(recorder)]]));

      await engine.execute({ type: 'GLOBAL', payload: 'value' }, emptyScope);

      expect(recorder.applied).toEqual(['value']);
    });

    it('prefers the scoped handler over the global one', async () => {
      const scoped: Recorder = { applied: [] };
      const global: Recorder = { applied: [] };
      globalUpdaters.set(new Map([['BOTH', recordingHandler(global)]]));

      await engine.execute(
        { type: 'BOTH', payload: 1 },
        scopeOf(['BOTH', recordingHandler(scoped)]),
      );

      expect(scoped.applied).toEqual([1]);
      expect(global.applied).toEqual([]);
    });

    it('accepts an action no updater handles', async () => {
      await expect(
        engine.execute({ type: 'UNHANDLED' }, emptyScope),
      ).resolves.not.toThrow();
    });

    it('lets an updater failure escape synchronously', () => {
      const failure = new Error('updater failure');
      const scope = scopeOf(['FAILING', throwingHandler(failure)]);

      expect(() => engine.execute({ type: 'FAILING' }, scope)).toThrow(failure);
    });
  });

  describe('misrouted dispatch', () => {
    it('throws for an action claimed by an updater absent from the scope', () => {
      declareUpdaterActionTypes(['ENGINE_OWNED_ELSEWHERE']);
      const throwing = build('throw');

      expect(() =>
        throwing.execute({ type: 'ENGINE_OWNED_ELSEWHERE' }, emptyScope),
      ).toThrow(/No updater in scope for "ENGINE_OWNED_ELSEWHERE"/);
    });

    it('reports the same action instead of throwing', async () => {
      declareUpdaterActionTypes(['ENGINE_REPORTED']);
      const reporting = build('report');

      await expect(
        reporting.execute({ type: 'ENGINE_REPORTED' }, emptyScope),
      ).resolves.not.toThrow();

      expect(handledErrors.length).toBe(1);
      expect((handledErrors[0] as Error).message).toMatch(
        /No updater in scope for "ENGINE_REPORTED"/,
      );
    });

    it('runs none of the effects of a misrouted action', async () => {
      declareUpdaterActionTypes(['ENGINE_REPORTED_WITH_EFFECT']);
      const reporting = build('report');
      const calls: string[] = [];
      register('ENGINE_REPORTED_WITH_EFFECT', () => {
        calls.push('ran');
      });

      await reporting.execute(
        { type: 'ENGINE_REPORTED_WITH_EFFECT' },
        emptyScope,
      );

      // The effects belong to whoever owns the updater, so running them here
      // would cascade their actions into a scope that owns nothing.
      expect(calls).toEqual([]);
      expect(handledErrors.length).toBe(1);
    });

    it('leaves a misrouted action out of the history', async () => {
      declareUpdaterActionTypes(['ENGINE_REPORTED_UNRECORDED']);
      const reporting = build('report');

      await reporting.execute(
        { type: 'ENGINE_REPORTED_UNRECORDED' },
        emptyScope,
      );

      expect(history.snapshot()).toEqual([]);
    });

    it('accepts an action no updater ever declared', () => {
      const throwing = build('throw');

      expect(() =>
        throwing.execute({ type: 'ENGINE_EFFECT_ONLY' }, emptyScope),
      ).not.toThrow();
      expect(handledErrors).toEqual([]);
    });

    it('reports nothing for an action no updater ever declared', async () => {
      const reporting = build('report');

      await reporting.execute(
        { type: 'ENGINE_REPORTED_EFFECT_ONLY' },
        emptyScope,
      );

      expect(handledErrors).toEqual([]);
    });

    it('accepts a declared action once its handler is in scope', () => {
      declareUpdaterActionTypes(['ENGINE_IN_SCOPE']);
      const recorder: Recorder = { applied: [] };
      const throwing = build('throw');

      expect(() =>
        throwing.execute(
          { type: 'ENGINE_IN_SCOPE', payload: 1 },
          scopeOf(['ENGINE_IN_SCOPE', recordingHandler(recorder)]),
        ),
      ).not.toThrow();
      expect(recorder.applied).toEqual([1]);
    });

    it('accepts a declared action handled globally', () => {
      declareUpdaterActionTypes(['ENGINE_GLOBALLY_OWNED']);
      const recorder: Recorder = { applied: [] };
      globalUpdaters.set(
        new Map([['ENGINE_GLOBALLY_OWNED', recordingHandler(recorder)]]),
      );
      const throwing = build('throw');

      expect(() =>
        throwing.execute({ type: 'ENGINE_GLOBALLY_OWNED' }, emptyScope),
      ).not.toThrow();
    });

    it('runs the effects of an action this scope owns', async () => {
      declareUpdaterActionTypes(['ENGINE_OWNED_WITH_EFFECT']);
      const recorder: Recorder = { applied: [] };
      const calls: string[] = [];
      const reporting = build('report');
      register('ENGINE_OWNED_WITH_EFFECT', () => {
        calls.push('ran');
      });

      await reporting.execute(
        { type: 'ENGINE_OWNED_WITH_EFFECT', payload: 1 },
        scopeOf(['ENGINE_OWNED_WITH_EFFECT', recordingHandler(recorder)]),
      );

      expect(recorder.applied).toEqual([1]);
      expect(calls).toEqual(['ran']);
      expect(handledErrors).toEqual([]);
    });

    it('runs the effects of an action owned globally, in any scope', async () => {
      declareUpdaterActionTypes(['ENGINE_GLOBAL_WITH_EFFECT']);
      const recorder: Recorder = { applied: [] };
      const calls: string[] = [];
      const reporting = build('report');
      globalUpdaters.set(
        new Map([['ENGINE_GLOBAL_WITH_EFFECT', recordingHandler(recorder)]]),
      );
      register('ENGINE_GLOBAL_WITH_EFFECT', () => {
        calls.push('ran');
      });

      await reporting.execute(
        { type: 'ENGINE_GLOBAL_WITH_EFFECT' },
        emptyScope,
      );

      expect(calls).toEqual(['ran']);
      expect(handledErrors).toEqual([]);
    });

    it('runs the effects of an action no updater claims, in any scope', async () => {
      const calls: string[] = [];
      const reporting = build('report');
      register('ENGINE_UNCLAIMED_WITH_EFFECT', () => {
        calls.push('ran');
      });

      await reporting.execute(
        { type: 'ENGINE_UNCLAIMED_WITH_EFFECT' },
        emptyScope,
      );

      expect(calls).toEqual(['ran']);
      expect(handledErrors).toEqual([]);
    });

    it('still runs the effects of a misrouted action when told to ignore', async () => {
      declareUpdaterActionTypes(['ENGINE_IGNORED_WITH_EFFECT']);
      const calls: string[] = [];
      register('ENGINE_IGNORED_WITH_EFFECT', () => {
        calls.push('ran');
      });

      // What provideStatewiseTesting({ strict: false }) buys: a suite may
      // exercise effects without attaching a single updater.
      await engine.execute({ type: 'ENGINE_IGNORED_WITH_EFFECT' }, emptyScope);

      expect(calls).toEqual(['ran']);
      expect(handledErrors).toEqual([]);
    });

    it('stays silent when the reaction is to ignore', async () => {
      declareUpdaterActionTypes(['ENGINE_OWNED_ELSEWHERE']);

      await expect(
        engine.execute({ type: 'ENGINE_OWNED_ELSEWHERE' }, emptyScope),
      ).resolves.not.toThrow();

      expect(handledErrors).toEqual([]);
    });
  });

  describe('effects', () => {
    it('runs every effect registered for the action', async () => {
      const calls: string[] = [];
      register('SOURCE', () => {
        calls.push('first');
      });
      register('SOURCE', () => {
        calls.push('second');
      });

      await engine.execute({ type: 'SOURCE' }, emptyScope);

      expect(calls).toEqual(['first', 'second']);
    });

    it('hands the whole action to the effect', async () => {
      const seen: Action[] = [];
      register('SOURCE', (action) => {
        seen.push(action);
      });

      await engine.execute({ type: 'SOURCE', payload: 42 }, emptyScope);

      expect(seen).toEqual([{ type: 'SOURCE', payload: 42 }]);
    });

    /**
     * The library's headline guarantee: an effect always reads state its
     * updater has already settled. Asserted on what the handler saw on its
     * synchronous entry, not on the state once the cascade is over — the
     * latter holds whichever order the engine applies the two in.
     */
    it('has applied the updater before an effect handler starts', async () => {
      const recorder: Recorder = { applied: [] };
      const seenOnEntry: unknown[][] = [];
      register('SOURCE', () => {
        seenOnEntry.push([...recorder.applied]);
      });

      await engine.execute(
        { type: 'SOURCE', payload: 1 },
        scopeOf(['SOURCE', recordingHandler(recorder)]),
      );

      expect(seenOnEntry).toEqual([[1]]);
    });

    it('executes the actions an effect returns, in the same scope', async () => {
      const recorder: Recorder = { applied: [] };
      register('SOURCE', () => ({
        type: 'CHILD',
        payload: 'from-effect',
      }));

      await engine.execute(
        { type: 'SOURCE' },
        scopeOf(['CHILD', recordingHandler(recorder)]),
      );

      expect(recorder.applied).toEqual(['from-effect']);
    });

    it('settles only once the whole cascade is over', async () => {
      let releaseChild!: () => void;
      const childGate = new Promise<void>((resolve) => {
        releaseChild = resolve;
      });
      let finished = false;
      register('SOURCE', () => ({ type: 'CHILD' }));
      register('CHILD', async () => {
        await childGate;
      });

      const execution = engine
        .execute({ type: 'SOURCE' }, emptyScope)
        .then(() => {
          finished = true;
        });

      await Promise.resolve();
      expect(finished).toBe(false);

      releaseChild();
      await execution;
      expect(finished).toBe(true);
    });

    it('reports a synchronous effect failure as a rejection', async () => {
      const failure = new Error('synchronous effect failure');
      register('SOURCE', () => {
        throw failure;
      });

      await expect(
        engine.execute({ type: 'SOURCE' }, emptyScope),
      ).rejects.toEqual(failure);
    });

    it('reports an asynchronous effect failure as a rejection', async () => {
      const failure = new Error('asynchronous effect failure');
      register('SOURCE', () => Promise.reject(failure));

      await expect(
        engine.execute({ type: 'SOURCE' }, emptyScope),
      ).rejects.toEqual(failure);
    });

    it('waits for the sibling effects of a failing one before rejecting', async () => {
      let siblingFinished = false;
      register('SOURCE', () => Promise.reject(new Error('failing effect')));
      register('SOURCE', async () => {
        await Promise.resolve();
        await Promise.resolve();
        siblingFinished = true;
      });

      await expect(
        engine.execute({ type: 'SOURCE' }, emptyScope),
      ).rejects.toThrow();
      expect(siblingFinished).toBe(true);
    });

    /**
     * Three effects on one action: one failing late, one failing early, one
     * succeeding late. The arrangement separates two guarantees a single
     * failing effect cannot tell apart — "waits for every sibling" and
     * "reports the first failure, not the fastest" — so each is asserted on
     * its own.
     */
    describe('several effects failing on one action', () => {
      const failedLate = new Error('registered first, failing late');
      const failedEarly = new Error('registered second, failing early');

      let releaseLate!: () => void;
      let lateSiblingFinished: boolean;
      let lateSiblingFinishedWhenReported: boolean | undefined;
      let reported: Promise<unknown>;

      beforeEach(() => {
        const lateGate = new Promise<void>((resolve) => {
          releaseLate = resolve;
        });
        lateSiblingFinished = false;
        lateSiblingFinishedWhenReported = undefined;

        register('SOURCE', async () => {
          await lateGate;

          throw failedLate;
        });
        register('SOURCE', () => {
          throw failedEarly;
        });
        register('SOURCE', async () => {
          await lateGate;
          lateSiblingFinished = true;
        });

        reported = engine.execute({ type: 'SOURCE' }, emptyScope).then(
          () => undefined,
          (error: unknown) => {
            lateSiblingFinishedWhenReported = lateSiblingFinished;

            return error;
          },
        );
      });

      it('waits for every sibling branch before failing', async () => {
        // The early failure has had every chance to be reported by now, while
        // both late branches are still held by their gate.
        await drainMicrotasks();
        releaseLate();
        await reported;

        expect(lateSiblingFinishedWhenReported).toBe(true);
      });

      it('reports the first branch that failed, not the fastest', async () => {
        releaseLate();

        await expect(reported).resolves.toBe(failedLate);
      });
    });

    it('surfaces a failing cascaded action without dropping its siblings', async () => {
      const recorder: Recorder = { applied: [] };
      register('SOURCE', () => [
        { type: 'FAILING' },
        { type: 'SIBLING', payload: 'kept' },
      ]);
      const scope = scopeOf(
        ['FAILING', throwingHandler(new Error('cascaded updater failure'))],
        ['SIBLING', recordingHandler(recorder)],
      );

      await expect(engine.execute({ type: 'SOURCE' }, scope)).rejects.toThrow(
        'cascaded updater failure',
      );
      expect(recorder.applied).toEqual(['kept']);
    });
  });

  describe('observation', () => {
    /**
     * The paths extend each other, which is what makes a cascade readable:
     * three entries nothing used to relate now read out as one sequence.
     */
    it('records the action and its cascade in the history', async () => {
      register('SOURCE', () => ({ type: 'CHILD' }));
      register('CHILD', () => ({ type: 'GRANDCHILD' }));

      await engine.execute({ type: 'SOURCE' }, emptyScope);

      expect(history.snapshot()).toEqual([
        historyEntry({ type: 'SOURCE' }, ['SOURCE']),
        historyEntry({ type: 'CHILD' }, ['SOURCE', 'CHILD']),
        historyEntry({ type: 'GRANDCHILD' }, ['SOURCE', 'CHILD', 'GRANDCHILD']),
      ]);
    });

    it('waits for the effects of one action type in one scope', async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let settled = false;
      register('SOURCE', () => gate);

      const execution = engine.execute({ type: 'SOURCE' }, emptyScope);
      const waiting = engine.waitForEffect(emptyScope, 'SOURCE').then(() => {
        settled = true;
      });

      await Promise.resolve();
      expect(settled).toBe(false);

      release();
      await Promise.all([execution, waiting]);
      expect(settled).toBe(true);
    });

    it('ignores the effects started by another scope', async () => {
      const other = scopeOf();
      let release!: () => void;
      register(
        'SOURCE',
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );

      const execution = engine.execute({ type: 'SOURCE' }, other);

      await expect(
        engine.waitForEffect(emptyScope, 'SOURCE'),
      ).resolves.not.toThrow();
      await expect(engine.waitForAllEffects(emptyScope)).resolves.not.toThrow();

      release();
      await execution;
    });

    it('waits for all the effects of its own scope', async () => {
      register('SOURCE', () => Promise.resolve());

      const execution = engine.execute({ type: 'SOURCE' }, emptyScope);

      await expect(engine.waitForAllEffects(emptyScope)).resolves.not.toThrow();
      await execution;
    });
  });
  describe('interceptors', () => {
    it('hands the dispatched payload to the interceptor', async () => {
      const seen: unknown[] = [];
      guard('GUARDED', (action) => {
        seen.push(action.payload);
      });

      await engine.execute({ type: 'GUARDED', payload: 7 }, emptyScope);

      expect(seen).toEqual([7]);
    });

    it('lets the action through when the interceptor returns nothing', async () => {
      const recorder: Recorder = { applied: [] };
      guard('GUARDED', () => undefined);

      await engine.execute(
        { type: 'GUARDED', payload: 1 },
        scopeOf(['GUARDED', recordingHandler(recorder)]),
      );

      expect(recorder.applied).toEqual([1]);
    });

    it('lets the action through when the interceptor grants it', async () => {
      const recorder: Recorder = { applied: [] };
      guard('GUARDED', () => true);

      await engine.execute(
        { type: 'GUARDED', payload: 1 },
        scopeOf(['GUARDED', recordingHandler(recorder)]),
      );

      expect(recorder.applied).toEqual([1]);
    });

    it('asks the interceptor before the updater is applied', async () => {
      const order: string[] = [];
      guard('GUARDED', () => {
        order.push('asked');
      });

      await engine.execute(
        { type: 'GUARDED' },
        {
          updaters: new Map([
            [
              'GUARDED',
              {
                state: {},
                apply: (): void => {
                  order.push('applied');
                },
              },
            ],
          ]),
        },
      );

      expect(order).toEqual(['asked', 'applied']);
    });

    it('asks every interceptor of one action type, in registration order', async () => {
      const order: string[] = [];
      guard('GUARDED', () => {
        order.push('first');
      });
      guard('GUARDED', () => {
        order.push('second');
      });

      await engine.execute({ type: 'GUARDED' }, emptyScope);

      expect(order).toEqual(['first', 'second']);
    });

    it('stops asking at the first refusal', async () => {
      const order: string[] = [];
      guard('GUARDED', () => {
        order.push('refusing');

        return false;
      });
      guard('GUARDED', () => {
        order.push('never asked');
      });

      await engine.execute({ type: 'GUARDED' }, emptyScope);

      expect(order).toEqual(['refusing']);
    });

    it('asks nothing on a misrouted dispatch', () => {
      declareUpdaterActionTypes(['ENGINE_GUARDED_ELSEWHERE']);
      const order: string[] = [];
      guard('ENGINE_GUARDED_ELSEWHERE', () => {
        order.push('asked');
      });

      expect(() =>
        build('throw').execute(
          { type: 'ENGINE_GUARDED_ELSEWHERE' },
          emptyScope,
        ),
      ).toThrow(/No updater in scope/);
      expect(order).toEqual([]);
    });

    it('lets an interceptor failure escape at the call site', () => {
      const failure = new Error('interceptor failure');
      guard('GUARDED', () => {
        throw failure;
      });

      expect(() => engine.execute({ type: 'GUARDED' }, emptyScope)).toThrow(
        failure,
      );
    });

    /**
     * The four consequences of a refusal, asserted one at a time: asserting
     * them together would not say which of them holds.
     */
    describe('a refusal', () => {
      it('applies no updater', async () => {
        const recorder: Recorder = { applied: [] };
        guard('REFUSED', () => false);

        await engine.execute(
          { type: 'REFUSED', payload: 1 },
          scopeOf(['REFUSED', recordingHandler(recorder)]),
        );

        expect(recorder.applied).toEqual([]);
      });

      it('starts no effect', async () => {
        let runs = 0;
        register('REFUSED', () => {
          runs += 1;
        });
        guard('REFUSED', () => false);

        await engine.execute({ type: 'REFUSED' }, emptyScope);

        expect(runs).toBe(0);
      });

      it('records no history entry', async () => {
        guard('REFUSED', () => false);

        await engine.execute({ type: 'REFUSED' }, emptyScope);

        expect(history.snapshot()).toEqual([]);
      });

      it('settles the execution instead of failing it', async () => {
        guard('REFUSED', () => false);

        await expect(
          engine.execute({ type: 'REFUSED' }, emptyScope),
        ).resolves.not.toThrow();
      });

      it('is not reported to the ErrorHandler', async () => {
        guard('REFUSED', () => false);

        await engine.execute({ type: 'REFUSED' }, emptyScope);

        expect(handledErrors).toEqual([]);
      });

      /**
       * A refusal stops what the action would start, not what it was told to
       * stop: the runs it cancels are abandoned before any interceptor is
       * asked, so a `cancelOn` declaration holds whatever the verdict is.
       */
      it('still abandons the runs the refused action cancels', async () => {
        let release!: () => void;
        let aborted: boolean | undefined;
        effects.register(
          'HELD',
          registeredEffect(
            async (_action, { abortSignal }) => {
              await new Promise<void>((resolve) => {
                release = resolve;
              });
              aborted = abortSignal.aborted;
            },
            { cancelledBy: ['REFUSED'] },
          ),
        );
        guard('REFUSED', () => false);

        const held = engine.execute({ type: 'HELD' }, emptyScope);
        await engine.execute({ type: 'REFUSED' }, emptyScope);
        release();
        await held;

        expect(aborted).toBe(true);
      });

      /**
       * `execute` is the single path every action takes, so an interceptor
       * guards a cascaded action exactly as it guards a dispatched one. The
       * branch stops there without failing the dispatch that started it.
       */
      it('stops a cascaded action without failing its dispatch', async () => {
        const recorder: Recorder = { applied: [] };
        register('SOURCE', () => ({ type: 'REFUSED', payload: 1 }));
        guard('REFUSED', () => false);

        await expect(
          engine.execute(
            { type: 'SOURCE' },
            scopeOf(['REFUSED', recordingHandler(recorder)]),
          ),
        ).resolves.not.toThrow();

        expect(recorder.applied).toEqual([]);
        expect(history.snapshot()).toEqual([
          historyEntry({ type: 'SOURCE' }, ['SOURCE']),
        ]);
      });
    });
  });

  describe('cascade bound', () => {
    it("stops two effects returning each other's action", async () => {
      register('PING', () => ({ type: 'PONG' }));
      register('PONG', () => ({ type: 'PING' }));

      await expect(
        engine.execute({ type: 'PING' }, emptyScope),
      ).rejects.toThrow(/PING → PONG → PING/);
    });

    it('names the whole path of the cascade it stopped', async () => {
      register('SOURCE', () => ({ type: 'CHILD' }));
      register('CHILD', () => ({ type: 'GRANDCHILD' }));
      engine = build('ignore', 2);

      await expect(
        engine.execute({ type: 'SOURCE' }, emptyScope),
      ).rejects.toThrow('SOURCE → CHILD → GRANDCHILD');
    });

    it('lets a cascade reaching the bound exactly through', async () => {
      const recorder: Recorder = { applied: [] };
      register('SOURCE', () => ({ type: 'CHILD' }));
      engine = build('ignore', 2);

      await engine.execute(
        { type: 'SOURCE' },
        scopeOf(['CHILD', recordingHandler(recorder)]),
      );

      expect(recorder.applied).toEqual([undefined]);
    });

    /**
     * The bound is checked before anything is applied, so the action it
     * refuses leaves nothing behind — otherwise a half-applied cascade would
     * be harder to reason about than the one that was stopped.
     */
    it('leaves no trace of the action it refused', async () => {
      const recorder: Recorder = { applied: [] };
      let blockedEffectRuns = 0;
      register('SOURCE', () => ({ type: 'BLOCKED' }));
      register('BLOCKED', () => {
        blockedEffectRuns += 1;
      });
      engine = build('ignore', 1);

      await expect(
        engine.execute(
          { type: 'SOURCE' },
          scopeOf(['BLOCKED', recordingHandler(recorder)]),
        ),
      ).rejects.toThrow(/maxCascadeDepth/);

      expect(recorder.applied).toEqual([]);
      expect(blockedEffectRuns).toBe(0);
      expect(history.snapshot()).toEqual([
        historyEntry({ type: 'SOURCE' }, ['SOURCE']),
      ]);
    });

    /**
     * Depth is what the bound counts, not breadth: a fan-out of siblings all
     * sits at the same level, and stopping it would fire on a cascade that
     * was going to end.
     */
    it('counts the depth of a cascade, not the actions it fans out', async () => {
      const recorder: Recorder = { applied: [] };
      register('SOURCE', () => [
        { type: 'CHILD', payload: 'first' },
        { type: 'CHILD', payload: 'second' },
        { type: 'CHILD', payload: 'third' },
      ]);
      engine = build('ignore', 2);

      await engine.execute(
        { type: 'SOURCE' },
        scopeOf(['CHILD', recordingHandler(recorder)]),
      );

      expect(recorder.applied).toEqual(['first', 'second', 'third']);
    });
  });

  /**
   * The guide forbids returning another feature's action and prescribes
   * calling that feature's manager instead. That call leaves the tree of
   * promises the dispatch is holding, so the cascade it starts has to be
   * adopted back into it — which is what these three specs pin, limit
   * included.
   */
  describe('across manager boundaries', () => {
    let downstreamScope: DispatchScope;
    let pingScope: DispatchScope;
    let pongScope: DispatchScope;

    /**
     * What a third-party manager does when an effect calls it: `dispatch()`
     * hands the action to the engine on the manager's own scope, and reports a
     * failure to the ErrorHandler because nobody is awaiting it.
     */
    function dispatchThroughManager(
      action: Action,
      scope: DispatchScope,
    ): void {
      const execution = engine.execute(action, scope);

      void execution.catch((error: unknown) => {
        errorHandler.handleError(error);
      });
    }

    beforeEach(() => {
      downstreamScope = scopeOf();
      pingScope = scopeOf();
      pongScope = scopeOf();
    });

    /**
     * The shape of `auth.effect.ts:64-69`: a synchronous handler calls the
     * downstream manager and hands nothing back to await. The dispatch used
     * to settle while that reload was still in flight, which is the one thing
     * the guide promises it never does.
     */
    it('waits for a cascade an effect started through another manager', async () => {
      let downstreamFinished = false;
      register('UPSTREAM', () => {
        dispatchThroughManager({ type: 'DOWNSTREAM' }, downstreamScope);
      });
      register('DOWNSTREAM', async () => {
        await drainMicrotasks();
        downstreamFinished = true;
      });

      await engine.execute({ type: 'UPSTREAM' }, emptyScope);

      expect(downstreamFinished).toBe(true);
      expect(handledErrors).toEqual([]);
    });

    /**
     * The measured limit of the mechanism, and it does not move: a dispatch
     * emitted past an `await` cannot be attributed to the handler that
     * emitted it, because no asynchronous context survives here. This spec
     * exists so nobody later believes the limit went away — and the limit
     * falls exactly where the caller already holds a promise of its own, an
     * `await` having necessarily given it one.
     */
    it('does not wait for a cascade started past an await', async () => {
      let downstreamFinished = false;
      register('UPSTREAM', async () => {
        await Promise.resolve();
        dispatchThroughManager({ type: 'DOWNSTREAM' }, downstreamScope);
      });
      register('DOWNSTREAM', async () => {
        await drainMicrotasks();
        downstreamFinished = true;
      });

      await engine.execute({ type: 'UPSTREAM' }, emptyScope);

      expect(downstreamFinished).toBe(false);

      // Still in flight, and observable the way the guide tells a consumer to
      // observe it: through the promise the manager call hands back.
      await engine.waitForAllEffects(downstreamScope);
      expect(downstreamFinished).toBe(true);
    });

    /**
     * The bound counts a path, and a call to a third-party manager used to
     * arrive with an empty one — so a cycle closing through two managers was
     * a fresh cascade of depth one at every turn, and it span until the stack
     * gave way, 327 turns in, while the dispatch that started it resolved
     * normally and the caller learnt nothing.
     */
    it('stops a cycle closing through two managers', async () => {
      let pings = 0;
      register('PING', () => {
        pings += 1;
        dispatchThroughManager({ type: 'PONG' }, pongScope);
      });
      register('PONG', () => {
        dispatchThroughManager({ type: 'PING' }, pingScope);
      });
      engine = build('ignore', 6);

      await expect(engine.execute({ type: 'PING' }, pingScope)).rejects.toThrow(
        /maxCascadeDepth/,
      );

      expect(pings).toBeLessThanOrEqual(6);

      // Every intermediate manager dispatched fire-and-forget, so each is
      // told of the refusal as well — that is what `dispatch()` asks for.
      // What must be gone is what used to happen instead: a stack overflow,
      // escaping as a rejection nobody observes.
      expect(
        handledErrors.filter((error) => error instanceof RangeError),
      ).toEqual([]);
    });
  });

  describe('concurrency policy', () => {
    /**
     * The run was abandoned while its cascade was still going, so the failure
     * of that cascade concerns nobody: whoever awaited it has been replaced.
     * Reporting it would blame the caller for work it no longer owns.
     */
    it('swallows the failure of a cascade abandoned along the way', async () => {
      let failChild!: (reason: Error) => void;
      let childStarted!: () => void;
      const childGate = new Promise<void>((_, reject) => {
        failChild = reject;
      });
      const started = new Promise<void>((resolve) => {
        childStarted = resolve;
      });
      let childRuns = 0;

      effects.register(
        'SOURCE',
        registeredEffect(() => ({ type: 'CHILD' }), { concurrency: 'latest' }),
      );
      register('CHILD', async () => {
        childRuns += 1;

        // Only the cascade of the first run is held, so the run replacing it
        // finishes cleanly.
        if (childRuns === 1) {
          childStarted();
          await childGate;
        }
      });

      const abandoned = engine.execute({ type: 'SOURCE' }, emptyScope);
      await started;

      const current = engine.execute({ type: 'SOURCE' }, emptyScope);
      failChild(new Error('failure nobody awaits'));

      await expect(abandoned).resolves.not.toThrow();
      await expect(current).resolves.not.toThrow();
      expect(childRuns).toBe(2);
    });

    /**
     * A superseded run answers nothing by design, so holding it to its own
     * promise would report a failure the application never caused.
     */
    it('does not blame an abandoned run for answering nothing', async () => {
      let release!: () => void;
      effects.register(
        'SOURCE',
        registeredEffect(
          () =>
            new Promise<void>((resolve) => {
              release = resolve;
            }),
          { concurrency: 'latest', mustAnswer: true },
        ),
      );

      const abandoned = engine.execute({ type: 'SOURCE' }, emptyScope);
      const current = engine.execute({ type: 'SOURCE' }, emptyScope);
      release();

      await expect(abandoned).resolves.not.toThrow();
      await expect(current).rejects.toThrow(/mustAnswer/);
    });

    it('starts no handler for a dispatch its policy holds back', async () => {
      let release!: () => void;
      let runs = 0;
      effects.register(
        'SOURCE',
        registeredEffect(
          () => {
            runs += 1;

            return new Promise<void>((resolve) => {
              release = resolve;
            });
          },
          { concurrency: 'first' },
        ),
      );

      const held = engine.execute({ type: 'SOURCE' }, emptyScope);
      await expect(
        engine.execute({ type: 'SOURCE' }, emptyScope),
      ).resolves.not.toThrow();

      expect(runs).toBe(1);

      release();
      await held;
    });
  });
});
