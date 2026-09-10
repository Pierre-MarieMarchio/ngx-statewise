import type { ErrorHandler } from '@angular/core';

import { registeredEffect } from '../../spec-helpers/registered-effect';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import type { RegisteredEffect } from '../effect/registered-effect';
import { RunningEffects } from '../effect/running-effects';
import { InterceptorRegistry } from '../interceptor/interceptor-registry';
import type { StateBoundHandler } from '../updater/updater-definition';
import { historyEntry } from '../../spec-helpers/history-entry';
import { ActionHistory, keepAction } from './action-history';
import { DEFAULT_MAX_CASCADE_DEPTH } from './cascade-depth';
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
  let history: ActionHistory;
  let handled: unknown[];
  let errorHandler: ErrorHandler;

  function refWith(scope: DispatchScope): ScopedStatewiseRef {
    return new ScopedStatewiseRef(engine, scope, errorHandler);
  }

  function plainRef(): ScopedStatewiseRef {
    return refWith({ updaters: new Map() });
  }

  /** Registers a handler as an effect declaring no options. */
  function register(actionType: string, run: RegisteredEffect['run']): void {
    effects.register(actionType, registeredEffect(run));
  }

  beforeEach(() => {
    effects = new EffectRegistry();
    handled = [];
    errorHandler = {
      handleError: (error: unknown): void => {
        handled.push(error);
      },
    };
    history = new ActionHistory(10, keepAction);
    engine = new StatewiseEngine(
      effects,
      new InterceptorRegistry(),
      new RunningEffects(),
      new GlobalUpdaterRegistry(),
      new PendingEffects(),
      history,
      errorHandler,
      'ignore',
      DEFAULT_MAX_CASCADE_DEPTH,
    );
  });

  describe('dispatch', () => {
    it('starts the dispatch without waiting for it', () => {
      const seen: string[] = [];
      register('SOURCE', () => {
        seen.push('ran');
      });

      plainRef().dispatch({ type: 'SOURCE' });

      expect(seen).toEqual(['ran']);
    });

    it('reports an asynchronous effect failure to the ErrorHandler', async () => {
      const effectFailure = new Error('effect failure');
      register('SOURCE', () => Promise.reject(effectFailure));
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
      register('SOURCE', () => Promise.resolve({ type: 'CHILD' }));

      await expect(
        plainRef().dispatchAsync({ type: 'SOURCE' }),
      ).resolves.not.toThrow();
      expect(history.snapshot()).toEqual([
        historyEntry({ type: 'SOURCE' }, ['SOURCE']),
        historyEntry({ type: 'CHILD' }, ['SOURCE', 'CHILD']),
      ]);
    });

    it('rejects on an updater failure instead of throwing synchronously', async () => {
      const ref = refWith({
        updaters: new Map([['FAILING_UPDATE', failingHandler]]),
      });

      await expect(
        ref.dispatchAsync({ type: 'FAILING_UPDATE' }),
      ).rejects.toEqual(failure);
      expect(handled).toEqual([]);
    });

    it('rejects on an effect failure without reporting it twice', async () => {
      const effectFailure = new Error('effect failure');
      register('SOURCE', () => Promise.reject(effectFailure));

      await expect(
        plainRef().dispatchAsync({ type: 'SOURCE' }),
      ).rejects.toEqual(effectFailure);
      expect(handled).toEqual([]);
    });
  });

  describe('observation', () => {
    it('accepts a creator as well as an action', async () => {
      const ref = plainRef();

      await expect(
        ref.waitForEffect({ type: 'SOURCE' }),
      ).resolves.not.toThrow();
      await expect(ref.waitForAllEffects()).resolves.not.toThrow();
    });

    it('observes only the effects it started itself', async () => {
      let release!: () => void;
      register(
        'SOURCE',
        () =>
          new Promise<void>((resolve) => {
            release = resolve;
          }),
      );
      const observer = plainRef();
      const dispatcher = plainRef();

      const execution = dispatcher.dispatchAsync({ type: 'SOURCE' });

      await expect(
        observer.waitForEffect({ type: 'SOURCE' }),
      ).resolves.not.toThrow();
      await expect(observer.waitForAllEffects()).resolves.not.toThrow();

      release();
      await execution;
    });
  });
});
