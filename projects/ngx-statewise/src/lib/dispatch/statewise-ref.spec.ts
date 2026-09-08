import type { ErrorHandler } from '@angular/core';

import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import type { StateBoundHandler } from '../updater/updater-definition';
import { ActionHistory } from './action-history';
import type { DispatchScope } from './dispatch-scope';
import { GlobalUpdaterRegistry } from './global-updater-registry';
import { StatewiseEngine } from './statewise-engine';
import { ScopedStatewiseRef } from './statewise-ref';

const failure = new Error('updater failure');
const failingHandler: StateBoundHandler = {
  state: {},
  apply: (): void => {
    throw failure;
  },
};

describe('ScopedStatewiseRef', () => {
  let effects: EffectRegistry;
  let engine: StatewiseEngine;
  let handled: unknown[];
  let errorHandler: ErrorHandler;

  function refWith(scope: DispatchScope): ScopedStatewiseRef {
    return new ScopedStatewiseRef(engine, scope, errorHandler);
  }

  function plainRef(): ScopedStatewiseRef {
    return refWith({ updaters: new Map() });
  }

  beforeEach(() => {
    effects = new EffectRegistry();
    handled = [];
    errorHandler = {
      handleError: (error: unknown): void => {
        handled.push(error);
      },
    };
    engine = new StatewiseEngine(
      effects,
      new GlobalUpdaterRegistry(),
      new PendingEffects(),
      new ActionHistory(10),
      errorHandler,
      'ignore',
    );
  });

  describe('dispatch', () => {
    it('starts the dispatch without waiting for it', () => {
      const seen: string[] = [];
      effects.register('SOURCE', () => {
        seen.push('ran');
      });

      plainRef().dispatch({ type: 'SOURCE' });

      expect(seen).toEqual(['ran']);
    });

    it('reports an asynchronous effect failure to the ErrorHandler', async () => {
      const effectFailure = new Error('effect failure');
      effects.register('SOURCE', () => Promise.reject(effectFailure));
      const ref = plainRef();

      ref.dispatch({ type: 'SOURCE' });
      await ref.waitForAllEffects();
      await Promise.resolve();

      expect(handled).toEqual([effectFailure]);
    });

    it('lets an updater failure escape at the call site', () => {
      const ref = refWith({
        updaters: new Map([['FAILING_UPDATE', failingHandler]]),
      });

      expect(() => {
        ref.dispatch({ type: 'FAILING_UPDATE' });
      }).toThrow(failure);
      expect(handled).toEqual([]);
    });
  });

  describe('dispatchAsync', () => {
    it('resolves once the cascade is over', async () => {
      effects.register('SOURCE', () => Promise.resolve({ type: 'CHILD' }));

      await expectAsync(
        plainRef().dispatchAsync({ type: 'SOURCE' }),
      ).toBeResolved();
      expect(engine.recordedActions()).toEqual([
        { type: 'SOURCE' },
        { type: 'CHILD' },
      ]);
    });

    it('rejects on an updater failure instead of throwing synchronously', async () => {
      const ref = refWith({
        updaters: new Map([['FAILING_UPDATE', failingHandler]]),
      });

      await expectAsync(
        ref.dispatchAsync({ type: 'FAILING_UPDATE' }),
      ).toBeRejectedWith(failure);
      expect(handled).toEqual([]);
    });

    it('rejects on an effect failure without reporting it twice', async () => {
      const effectFailure = new Error('effect failure');
      effects.register('SOURCE', () => Promise.reject(effectFailure));

      await expectAsync(
        plainRef().dispatchAsync({ type: 'SOURCE' }),
      ).toBeRejectedWith(effectFailure);
      expect(handled).toEqual([]);
    });
  });

  describe('observation', () => {
    it('accepts a creator as well as an action', async () => {
      const ref = plainRef();

      await expectAsync(ref.waitForEffect({ type: 'SOURCE' })).toBeResolved();
      await expectAsync(ref.waitForAllEffects()).toBeResolved();
    });

    it('observes only the effects it started itself', async () => {
      let release!: () => void;
      effects.register(
        'SOURCE',
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );
      const observer = plainRef();
      const dispatcher = plainRef();

      const execution = dispatcher.dispatchAsync({ type: 'SOURCE' });

      await expectAsync(
        observer.waitForEffect({ type: 'SOURCE' }),
      ).toBeResolved();
      await expectAsync(observer.waitForAllEffects()).toBeResolved();

      release();
      await execution;
    });

    it('exposes the history recorded by the engine', () => {
      const ref = plainRef();

      ref.dispatch({ type: 'SOURCE' });

      expect(ref.recordedActions()).toEqual([{ type: 'SOURCE' }]);
    });
  });
});
