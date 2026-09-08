import { ErrorHandler, Inject, Injectable } from '@angular/core';

import type { Action } from '../action';
import { resolveEffectOutcome } from '../effect/effect-outcome';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import type { RegisteredEffect } from '../effect/registered-effect';
import { isUpdaterActionTypeDeclared } from '../updater/declared-action-types';
import type { StateBoundHandler } from '../updater/updater-definition';
import { ActionHistory } from './action-history';
import type { DispatchScope } from './dispatch-scope';
import { GlobalUpdaterRegistry } from './global-updater-registry';
import {
  misroutedActionError,
  MISROUTED_DISPATCH_REACTION,
  type MisroutedDispatchReaction,
} from './misrouted-dispatch';

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
    private readonly errorHandler: ErrorHandler,
    @Inject(MISROUTED_DISPATCH_REACTION)
    private readonly misroutedDispatch: MisroutedDispatchReaction,
  ) {}

  /**
   * An updater failure is a programming error and escapes synchronously, so it
   * surfaces at the call site instead of being buried in a rejected promise.
   */
  public execute(action: Action, scope: DispatchScope): Promise<void> {
    const handler = this.resolveHandler(action.type, scope);

    if (this.isMisrouted(action.type, handler)) {
      this.reportMisrouted(action.type);

      // Nothing of this action belongs to this scope, its effects included:
      // running them here would cascade their actions into the wrong scope.
      return Promise.resolve();
    }

    handler?.apply(action.payload);
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

  /** The single handler owning this action type in this scope, if any. */
  private resolveHandler(
    actionType: string,
    scope: DispatchScope,
  ): StateBoundHandler | undefined {
    return (
      scope.updaters.get(actionType) ?? this.globalUpdaters.get(actionType)
    );
  }

  /**
   * Whether the dispatch reached a scope that owns nothing of this action.
   *
   * An action type claimed by an updater this scope cannot resolve belongs to
   * another manager. A type no updater claims belongs to every scope — that is
   * an effect-only action, and it stays valid everywhere.
   *
   * `'ignore'` opts out of the whole notion, which is what a test suite
   * exercising effects without attaching any updater asks for.
   */
  private isMisrouted(
    actionType: string,
    handler: StateBoundHandler | undefined,
  ): boolean {
    return (
      handler === undefined &&
      this.misroutedDispatch !== 'ignore' &&
      isUpdaterActionTypeDeclared(actionType)
    );
  }

  /**
   * Reporting rather than throwing keeps a production dispatch from taking the
   * application down, while still surfacing an action that did nothing.
   */
  private reportMisrouted(actionType: string): void {
    if (this.misroutedDispatch === 'throw') {
      throw misroutedActionError(actionType);
    }

    this.errorHandler.handleError(misroutedActionError(actionType));
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
