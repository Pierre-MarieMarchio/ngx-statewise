import { ErrorHandler, Inject, Injectable } from '@angular/core';

import type { Action } from '../action';
import { resolveEffectOutcome } from '../effect/effect-outcome';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import type { RegisteredEffect } from '../effect/registered-effect';
import { RunningEffects, type EffectRun } from '../effect/running-effects';
import { unansweredEffectError } from '../effect/unanswered-effect';
import { InterceptorRegistry } from '../interceptor/interceptor-registry';
import { isUpdaterActionTypeDeclared } from '../updater/declared-action-types';
import type { StateBoundHandler } from '../updater/updater-definition';
import { ActionHistory } from './action-history';
import { cascadeDepthExceededError, MAX_CASCADE_DEPTH } from './cascade-depth';
import type { DispatchScope } from './dispatch-scope';
import { GlobalUpdaterRegistry } from './global-updater-registry';
import {
  misroutedActionError,
  MISROUTED_DISPATCH_REACTION,
  type MisroutedDispatchReaction,
} from './misrouted-dispatch';

/**
 * A cascade offering itself for adoption while its handler runs.
 *
 * Carries the path an adopted dispatch inherits, which is what lets the bound
 * see a cycle closing through a manager: without it, every call to a
 * third-party manager starts a fresh cascade of depth one, and two effects
 * calling each other spin until the stack gives way.
 */
interface OpenCascade {
  readonly path: readonly string[];
  /**
   * Filled by adoption, and awaited by the host once its handler has
   * answered. This is what makes the wait transitive: a cascade crossing a
   * manager boundary stays one tree of promises instead of two.
   */
  readonly branches: Promise<void>[];
}

/**
 * Runs actions: asks their interceptors, applies their updater, then their
 * effects, and recursively the actions those effects return. The returned
 * promise settles once the whole cascade started by the action is over.
 */
@Injectable()
export class StatewiseEngine {
  public constructor(
    private readonly effects: EffectRegistry,
    private readonly interceptors: InterceptorRegistry,
    private readonly runningEffects: RunningEffects,
    private readonly globalUpdaters: GlobalUpdaterRegistry,
    private readonly pendingEffects: PendingEffects,
    private readonly actionHistory: ActionHistory,
    private readonly errorHandler: ErrorHandler,
    @Inject(MISROUTED_DISPATCH_REACTION)
    private readonly misroutedDispatch: MisroutedDispatchReaction,
    @Inject(MAX_CASCADE_DEPTH) private readonly maxCascadeDepth: number,
  ) {}

  /**
   * The cascade whose effect handler is running right now, if any.
   *
   * A field rather than an argument threaded through, because what reaches
   * the engine is a call from a third-party manager, and a manager knows
   * nothing of the cascade that called it. Synchronous by nature: past an
   * `await` no asynchronous context survives here. `AsyncLocalStorage` does
   * not exist in a browser, and zone.js is excluded by construction.
   */
  private openCascade: OpenCascade | undefined;

  /**
   * An updater failure is a programming error and escapes synchronously, so it
   * surfaces at the call site instead of being buried in a rejected promise.
   * An interceptor failure is the same kind of error, and escapes the same
   * way, which being synchronous is what allows.
   *
   * `path` is the chain of action types that led here, and is internal: a
   * caller dispatches an action, never a cascade.
   */
  public execute(
    action: Action,
    scope: DispatchScope,
    path: readonly string[] = [],
  ): Promise<void> {
    // A root dispatch reaching the engine while an effect handler runs was
    // emitted by that handler, through the third-party manager the guide
    // prescribes for crossing a feature boundary. It belongs to the cascade
    // of that handler, and inherits its path.
    if (path.length === 0 && this.openCascade !== undefined) {
      return this.adopt(action, scope, this.openCascade);
    }

    const cascade = [...path, action.type];

    // Raised before anything is applied, so an action the bound refuses
    // leaves no trace: no state update, no history entry, no effect started.
    if (cascade.length > this.maxCascadeDepth) {
      throw cascadeDepthExceededError(cascade, this.maxCascadeDepth);
    }

    const handler = this.resolveHandler(action.type, scope);

    if (this.isMisrouted(action.type, handler)) {
      this.reportMisrouted(action.type);

      // Nothing of this action belongs to this scope, its effects included:
      // running them here would cascade their actions into the wrong scope.
      return Promise.resolve();
    }

    // Abandoned before the interceptors are asked, so an action that both
    // cancels an effect and may be refused still replaces the runs it
    // declares cancelling. A refusal stops what this action would start, not
    // what it was told to stop.
    this.abandonRunsCancelledBy(action.type, scope);

    if (!this.wasGranted(action)) {
      return Promise.resolve();
    }

    handler?.apply(action.payload);
    this.actionHistory.record(action, cascade);

    return this.runEffects(action, scope, cascade);
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

  /**
   * Runs an action as part of the cascade adopting it.
   *
   * Taken through the protected path on purpose: the bound throws
   * synchronously, and the caller here is a manager that has not asked to
   * catch anybody else's cascade. A refusal must reject the cascade, not
   * escape at the call site of the manager.
   */
  private adopt(
    action: Action,
    scope: DispatchScope,
    host: OpenCascade,
  ): Promise<void> {
    const running = this.executeSafely(action, scope, host.path);

    host.branches.push(running);

    return running;
  }

  /**
   * Runs an effect handler with its cascade open for adoption.
   *
   * Around the call alone, never around the `await` that follows it: a window
   * held open for the whole duration of an effect would adopt dispatches that
   * merely overlap it and belong to nobody.
   */
  private withOpenCascade<Outcome>(
    cascade: OpenCascade,
    run: () => Outcome,
  ): Outcome {
    const enclosing = this.openCascade;
    this.openCascade = cascade;

    try {
      return run();
    } finally {
      this.openCascade = enclosing;
    }
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
   * another manager. A type no updater claims belongs to every scope, and that is
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

  /**
   * Whether every interceptor guarding this action type let it through.
   *
   * Asked in registration order and stopped at the first refusal: once the
   * decision is made, running the interceptors after it would let them act on
   * an action that is not going to happen.
   */
  private wasGranted(action: Action): boolean {
    for (const interceptor of this.interceptors.guarding(action.type)) {
      if (interceptor.ask(action) === false) {
        return false;
      }
    }

    return true;
  }

  private runEffects(
    action: Action,
    scope: DispatchScope,
    cascade: readonly string[],
  ): Promise<void> {
    return settleAll(
      this.effects
        .triggeredBy(action.type)
        .map((effect) => this.runEffect(effect, action, scope, cascade)),
    );
  }

  /**
   * Abandons before anything of this action happens, so an action that both
   * cancels and triggers an effect replaces its own runs instead of competing
   * with them.
   */
  private abandonRunsCancelledBy(
    actionType: string,
    scope: DispatchScope,
  ): void {
    for (const effect of this.effects.cancelledBy(actionType)) {
      this.runningEffects.cancel(effect, scope);
    }
  }

  private runEffect(
    effect: RegisteredEffect,
    action: Action,
    scope: DispatchScope,
    cascade: readonly string[],
  ): Promise<void> {
    const run = this.runningEffects.start(effect, scope, effect.keyOf(action));

    if (run === undefined) {
      // `'first'`: a run of this group is still in flight, so this dispatch
      // starts no handler at all. Its updater has been applied all the same.
      return Promise.resolve();
    }

    return this.pendingEffects.track(
      scope,
      action.type,
      this.completeRun(effect, action, scope, run, cascade),
    );
  }

  /**
   * Runs one effect and the actions it yields. A handler failing synchronously
   * is reported exactly like one failing asynchronously, since an `async`
   * method turns a synchronous throw into a rejection.
   */
  private async completeRun(
    effect: RegisteredEffect,
    action: Action,
    scope: DispatchScope,
    run: EffectRun,
    cascade: readonly string[],
  ): Promise<void> {
    const adopted: Promise<void>[] = [];

    try {
      const outcome = this.withOpenCascade(
        { path: cascade, branches: adopted },
        () => effect.run(action, { abortSignal: run.abortSignal }),
      );
      const actions = await resolveEffectOutcome(outcome, run.abortSignal);

      // The answer of an abandoned run is stale by definition: dispatching it
      // would let it overwrite the state its successor is building.
      if (run.abortSignal.aborted) {
        return;
      }

      // Checked after the abandon: a run that was replaced answers nothing on
      // purpose, and blaming it for that would report a failure the
      // application did not cause.
      if (effect.mustAnswer && actions.length === 0) {
        throw unansweredEffectError(action.type);
      }

      // The actions the handler answered, and the cascades it started through
      // another manager while it ran: both belong to this dispatch, so both
      // are awaited here.
      await settleAll([
        ...actions.map((next) => this.executeSafely(next, scope, cascade)),
        ...adopted,
      ]);
    } catch (error) {
      // Nobody awaits the answer of a run we deliberately abandoned, so its
      // failure is not the caller's to handle either.
      if (run.abortSignal.aborted) {
        return;
      }

      throw error;
    } finally {
      run.finish();
    }
  }

  /** Keeps a failing cascaded action from cancelling the actions beside it. */
  private async executeSafely(
    action: Action,
    scope: DispatchScope,
    cascade: readonly string[],
  ): Promise<void> {
    // `execute` is not `async`: an updater or an interceptor failure escapes it
    // synchronously, by design. Being `async` here is the whole mechanism:
    // that throw becomes the rejection the branch beside it settles against,
    // and the promise `execute` returns is adopted untouched.
    return this.execute(action, scope, cascade);
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
