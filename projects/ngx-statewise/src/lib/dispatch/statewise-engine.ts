import { Inject, Injectable } from '@angular/core';

import type { Action } from '../action';
import { resolveEffectOutcome } from '../effect/effect-outcome';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import type { RegisteredEffect } from '../effect/registered-effect';
import { isUpdaterActionTypeDeclared } from '../updater/declared-action-types';
import { ActionHistory } from './action-history';
import type { DispatchScope } from './dispatch-scope';
import { GlobalUpdaterRegistry } from './global-updater-registry';
import { misroutedActionError, STRICT_DISPATCH } from './strict-dispatch';

/**
 * Runs actions: applies their updater, then their effects, and recursively the
 * actions those effects return. The returned promise settles once the whole
 * cascade started by the action is over.
 */
@Injectable()
export class StatewiseEngine {
  public constructor(
    private readonly effects: EffectRegistry,
    private readonly globalUpdaters: GlobalUpdaterRegistry,
    private readonly pendingEffects: PendingEffects,
    private readonly actionHistory: ActionHistory,
    @Inject(STRICT_DISPATCH) private readonly strictDispatch: boolean,
  ) {}

  /**
   * An updater failure is a programming error and escapes synchronously, so it
   * surfaces at the call site instead of being buried in a rejected promise.
   */
  public execute(action: Action, scope: DispatchScope): Promise<void> {
    this.applyUpdater(action, scope);
    this.actionHistory.record(action);

    return this.runEffects(action, scope);
  }

  public waitForEffect(
    scope: DispatchScope,
    actionType: string,
  ): Promise<void> {
    return this.pendingEffects.waitFor(scope, actionType);
  }

  public waitForAllEffects(scope: DispatchScope): Promise<void> {
    return this.pendingEffects.waitForScope(scope);
  }

  public recordedActions(): readonly Action[] {
    return this.actionHistory.snapshot();
  }

  /** Applies the single handler owning this action type, if any. */
  private applyUpdater(action: Action, scope: DispatchScope): void {
    const handler =
      scope.updaters.get(action.type) ?? this.globalUpdaters.get(action.type);

    if (handler === undefined) {
      this.assertNotMisrouted(action.type);
      return;
    }

    handler.apply(action.payload);
  }

  /**
   * An action type claimed by an updater but absent from this scope means the
   * dispatch went through the wrong manager: say so rather than do nothing.
   */
  private assertNotMisrouted(actionType: string): void {
    if (this.strictDispatch && isUpdaterActionTypeDeclared(actionType)) {
      throw misroutedActionError(actionType);
    }
  }

  private runEffects(action: Action, scope: DispatchScope): Promise<void> {
    const effects = this.effects.get(action.type);

    return settleAll(
      effects.map((effect) => this.runEffect(effect, action, scope)),
    );
  }

  /**
   * Runs one effect and the actions it yields. A handler failing synchronously
   * is reported exactly like one failing asynchronously.
   */
  private runEffect(
    effect: RegisteredEffect,
    action: Action,
    scope: DispatchScope,
  ): Promise<void> {
    let outcome: Promise<void>;

    try {
      outcome = resolveEffectOutcome(effect(action)).then((actions) =>
        settleAll(actions.map((next) => this.executeSafely(next, scope))),
      );
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- rethrowing the caught value untouched
      outcome = Promise.reject(error);
    }

    return this.pendingEffects.track(scope, action.type, outcome);
  }

  /** Keeps a failing cascaded action from cancelling the actions beside it. */
  private executeSafely(action: Action, scope: DispatchScope): Promise<void> {
    try {
      return this.execute(action, scope);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- rethrowing the caught value untouched
      return Promise.reject(error);
    }
  }
}

/**
 * Waits for every branch before failing, so one failure never leaves its
 * siblings running unobserved, and reports the first error that occurred.
 */
async function settleAll(branches: readonly Promise<void>[]): Promise<void> {
  if (branches.length === 0) {
    return;
  }

  for (const outcome of await Promise.allSettled(branches)) {
    if (outcome.status === 'rejected') {
      throw outcome.reason;
    }
  }
}
