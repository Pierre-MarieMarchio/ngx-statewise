import { Action } from '../../action/action-type';
import { EffectManager } from '../../effect/effect-manager';
import { IUpdator } from '../../updator/updator-interfaces';
import {
  registerLocalUpdator,
  getLocalUpdator,
} from '../../updator/updator-localRegisteries';
import { StateStore } from '../store/state-store';
import { UpdatorGlobalRegistry } from '../../updator/updator-globalRegistery';
import { ActionDispatcher } from '../../action/action-dispatcher';
import { inject, Injectable } from '@angular/core';
import { withInjectionContext } from '../../../internal/injection-utils';

@Injectable({ providedIn: 'root' })
class DispatchAsyncHandler {
  private readonly store = inject(StateStore);
  private readonly dispatcher = ActionDispatcher.getInstance();
  private readonly effects = EffectManager.getInstance();
  private readonly globalRegistery = UpdatorGlobalRegistry.getInstance();

  public handle<T extends Action, S>(
    action: T,
    contextOrUpdator?: object | IUpdator<S>
  ): Promise<void> {
    this.setContext(action.type, contextOrUpdator);

    const explicit = this.asUpdator(contextOrUpdator);
    if (explicit) {
      registerLocalUpdator(explicit, explicit);
      return this.execWithCleanup(
        this.store.dispatshAsync(action, explicit),
        action.type
      );
    }

    const local = this.asLocal(contextOrUpdator, action.type);
    if (local) {
      return this.execWithCleanup(
        this.store.dispatshAsync(action, local),
        action.type
      );
    }

    const globalUpd = this.globalRegistery.getUpdator<S>(action.type);
    if (globalUpd) {
      return this.execWithCleanup(
        this.store.dispatshAsync(action, globalUpd),
        action.type
      );
    }

    this.dispatcher.emit(action);
    return this.execWithCleanup(this.effects.waitFor(action.type), action.type);
  }

  private setContext(type: string, context?: object | IUpdator<any>) {
    if (context) this.effects.setContextForAction(type, context);
  }

  private asUpdator<S>(updator?: object | IUpdator<S>): IUpdator<S> | null {
    return updator && 'state' in updator && 'updators' in updator
      ? updator
      : null;
  }

  private asLocal<S>(
    context: object | IUpdator<S> | undefined,
    type: string
  ): IUpdator<S> | null {
    return context && !this.asUpdator(context)
      ? getLocalUpdator(context as object, type) || null
      : null;
  }

  private async execWithCleanup(
    promise: Promise<void>,
    type: string
  ): Promise<void> {
    try {
      return await promise;
    } finally {
      this.effects.clearContext(type);
    }
  }
}

/**
 * Asynchronously dispatches an action and waits for effects to complete.
 *
 * Similar to `dispatch`, but returns a Promise that resolves when all associated
 * effects are completed. Supports both global and local updators.
 *
 * @template T - The action type.
 * @template S - The state type (inferred from updator if provided).
 * @param action - The action to dispatch.
 * @param updator - Optional updator to handle state updates for this action.
 * @returns A Promise that resolves when all effects for this action are completed.
 */
export async function dispatchAsync<T extends Action>(
  action: T,
  context?: object
): Promise<void>;
export async function dispatchAsync<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): Promise<void>;
export function dispatchAsync<T extends Action, S>(
  action: T,
  contextOrUpdator?: object | IUpdator<S>
): Promise<void> {
  return withInjectionContext(() => {
    const dispatchAsyncService = inject(DispatchAsyncHandler);
    return dispatchAsyncService.handle(action, contextOrUpdator);
  });
}
