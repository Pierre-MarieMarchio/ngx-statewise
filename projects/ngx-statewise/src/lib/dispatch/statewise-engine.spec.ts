import type { ErrorHandler } from '@angular/core';

import type { Action } from '../action';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import { declareUpdaterActionTypes } from '../updater/declared-action-types';
import type { StateBoundHandler } from '../updater/updater-definition';
import { ActionHistory } from './action-history';
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

describe('StatewiseEngine', () => {
  let effects: EffectRegistry;
  let globalUpdaters: GlobalUpdaterRegistry;
  let pendingEffects: PendingEffects;
  let history: ActionHistory;
  let handledErrors: unknown[];
  let errorHandler: ErrorHandler;
  let engine: StatewiseEngine;
  let emptyScope: DispatchScope;

  function build(
    misroutedDispatch: MisroutedDispatchReaction,
  ): StatewiseEngine {
    return new StatewiseEngine(
      effects,
      globalUpdaters,
      pendingEffects,
      history,
      errorHandler,
      misroutedDispatch,
    );
  }

  beforeEach(() => {
    effects = new EffectRegistry();
    globalUpdaters = new GlobalUpdaterRegistry();
    pendingEffects = new PendingEffects();
    history = new ActionHistory(10);
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
      await expectAsync(
        engine.execute({ type: 'UNHANDLED' }, emptyScope),
      ).toBeResolved();
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
      ).toThrowError(/No updater in scope for "ENGINE_OWNED_ELSEWHERE"/);
    });

    it('reports the same action instead of throwing', async () => {
      declareUpdaterActionTypes(['ENGINE_REPORTED']);
      const reporting = build('report');

      await expectAsync(
        reporting.execute({ type: 'ENGINE_REPORTED' }, emptyScope),
      ).toBeResolved();

      expect(handledErrors.length).toBe(1);
      expect((handledErrors[0] as Error).message).toMatch(
        /No updater in scope for "ENGINE_REPORTED"/,
      );
    });

    it('runs none of the effects of a misrouted action', async () => {
      declareUpdaterActionTypes(['ENGINE_REPORTED_WITH_EFFECT']);
      const reporting = build('report');
      const calls: string[] = [];
      effects.register('ENGINE_REPORTED_WITH_EFFECT', () => {
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

      expect(reporting.recordedActions()).toEqual([]);
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
      effects.register('ENGINE_OWNED_WITH_EFFECT', () => {
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
      effects.register('ENGINE_GLOBAL_WITH_EFFECT', () => {
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
      effects.register('ENGINE_UNCLAIMED_WITH_EFFECT', () => {
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
      effects.register('ENGINE_IGNORED_WITH_EFFECT', () => {
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

      await expectAsync(
        engine.execute({ type: 'ENGINE_OWNED_ELSEWHERE' }, emptyScope),
      ).toBeResolved();

      expect(handledErrors).toEqual([]);
    });
  });

  describe('effects', () => {
    it('runs every effect registered for the action', async () => {
      const calls: string[] = [];
      effects.register('SOURCE', () => {
        calls.push('first');
      });
      effects.register('SOURCE', () => {
        calls.push('second');
      });

      await engine.execute({ type: 'SOURCE' }, emptyScope);

      expect(calls).toEqual(['first', 'second']);
    });

    it('hands the whole action to the effect', async () => {
      const seen: Action[] = [];
      effects.register('SOURCE', (action) => {
        seen.push(action);
      });

      await engine.execute({ type: 'SOURCE', payload: 42 }, emptyScope);

      expect(seen).toEqual([{ type: 'SOURCE', payload: 42 }]);
    });

    it('executes the actions an effect returns, in the same scope', async () => {
      const recorder: Recorder = { applied: [] };
      effects.register('SOURCE', () => ({
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
      effects.register('SOURCE', () => ({ type: 'CHILD' }));
      effects.register('CHILD', async () => {
        await childGate;
      });

      const execution = engine
        .execute({ type: 'SOURCE' }, emptyScope)
        .then(() => {
          finished = true;
        });

      await Promise.resolve();
      expect(finished).toBeFalse();

      releaseChild();
      await execution;
      expect(finished).toBeTrue();
    });

    it('reports a synchronous effect failure as a rejection', async () => {
      const failure = new Error('synchronous effect failure');
      effects.register('SOURCE', () => {
        throw failure;
      });

      await expectAsync(
        engine.execute({ type: 'SOURCE' }, emptyScope),
      ).toBeRejectedWith(failure);
    });

    it('reports an asynchronous effect failure as a rejection', async () => {
      const failure = new Error('asynchronous effect failure');
      effects.register('SOURCE', () => Promise.reject(failure));

      await expectAsync(
        engine.execute({ type: 'SOURCE' }, emptyScope),
      ).toBeRejectedWith(failure);
    });

    it('waits for the sibling effects of a failing one before rejecting', async () => {
      let siblingFinished = false;
      effects.register('SOURCE', () =>
        Promise.reject(new Error('failing effect')),
      );
      effects.register('SOURCE', async () => {
        await Promise.resolve();
        await Promise.resolve();
        siblingFinished = true;
      });

      await expectAsync(
        engine.execute({ type: 'SOURCE' }, emptyScope),
      ).toBeRejected();
      expect(siblingFinished).toBeTrue();
    });

    it('surfaces a failing cascaded action without dropping its siblings', async () => {
      const recorder: Recorder = { applied: [] };
      effects.register('SOURCE', () => [
        { type: 'FAILING' },
        { type: 'SIBLING', payload: 'kept' },
      ]);
      const scope = scopeOf(
        ['FAILING', throwingHandler(new Error('cascaded updater failure'))],
        ['SIBLING', recordingHandler(recorder)],
      );

      await expectAsync(
        engine.execute({ type: 'SOURCE' }, scope),
      ).toBeRejectedWithError('cascaded updater failure');
      expect(recorder.applied).toEqual(['kept']);
    });
  });

  describe('observation', () => {
    it('records the action and its cascade in the history', async () => {
      effects.register('SOURCE', () => ({ type: 'CHILD' }));

      await engine.execute({ type: 'SOURCE' }, emptyScope);

      expect(engine.recordedActions()).toEqual([
        { type: 'SOURCE' },
        { type: 'CHILD' },
      ]);
    });

    it('waits for the effects of one action type in one scope', async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let settled = false;
      effects.register('SOURCE', () => gate);

      const execution = engine.execute({ type: 'SOURCE' }, emptyScope);
      const waiting = engine.waitForEffect(emptyScope, 'SOURCE').then(() => {
        settled = true;
      });

      await Promise.resolve();
      expect(settled).toBeFalse();

      release();
      await Promise.all([execution, waiting]);
      expect(settled).toBeTrue();
    });

    it('ignores the effects started by another scope', async () => {
      const other = scopeOf();
      let release!: () => void;
      effects.register(
        'SOURCE',
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );

      const execution = engine.execute({ type: 'SOURCE' }, other);

      await expectAsync(
        engine.waitForEffect(emptyScope, 'SOURCE'),
      ).toBeResolved();
      await expectAsync(engine.waitForAllEffects(emptyScope)).toBeResolved();

      release();
      await execution;
    });

    it('waits for all the effects of its own scope', async () => {
      effects.register('SOURCE', () => Promise.resolve());

      const execution = engine.execute({ type: 'SOURCE' }, emptyScope);

      await expectAsync(engine.waitForAllEffects(emptyScope)).toBeResolved();
      await execution;
    });
  });
});
