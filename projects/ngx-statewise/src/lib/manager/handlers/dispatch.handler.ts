import { Action } from '../../action/action-type';
import { ActionDispatcher } from '../../action/action-dispatcher';
import { EffectManager } from '../../effect/effect-manager';
import { IUpdator } from '../../updator/interfaces/updator.interfaces';
import { LocalUpdatorRegistry } from '../../updator/registries/local-updators.registery';
import { CoordinatorService } from '../services/coordinator.service';
import { GlobalUpdatorsRegistry } from '../../updator/registries/global-updators.registery';
import { inject, Injectable } from '@angular/core';
import { withInjectionContext } from '../../../internal/injection-utils';

@Injectable({ providedIn: 'root' })
class DispatchHandler {
  private readonly coordinator = inject(CoordinatorService);
  private readonly dispatcher = ActionDispatcher.getInstance();
  private readonly effects = EffectManager.getInstance();
  private readonly globalRegistery = inject(GlobalUpdatorsRegistry);
  private readonly localUpdatorsRegistery = inject(LocalUpdatorRegistry);

  public handle<T extends Action, S>(
    action: T,
    contextOrUpdator?: object | IUpdator<S>
  ): void {
    this.setContext(action.type, contextOrUpdator);

    const explicit = this.asUpdator(contextOrUpdator);
    if (explicit) return this.useExplicit(action, explicit);

    const local = this.asLocal(contextOrUpdator, action.type);
    if (local) return this.useLocal(action, local);

    this.useFallback(action);
  }

  private setContext(type: string, context?: object | IUpdator<any>) {
    if (context) this.effects.setContextForAction(type, context);
  }

  private asUpdator<S>(updator?: object | IUpdator<S>): IUpdator<S> | null {
    if (updator && 'state' in updator && 'updators' in updator) return updator;
    return null;
  }

  private asLocal<S>(
    context: object | IUpdator<S> | undefined,
    type: string
  ): IUpdator<S> | null {
    return context && !this.asUpdator(context)
      ? this.localUpdatorsRegistery.getLocalUpdator(context as object, type) ||
          null
      : null;
  }

  private useExplicit<T extends Action, S>(action: T, updator: IUpdator<S>) {
    this.localUpdatorsRegistery.registerLocalUpdator(updator, updator);
    this.coordinator.dispatch(action, updator);
  }

  private useLocal<T extends Action, S>(action: T, updator: IUpdator<S>) {
    this.coordinator.dispatch(action, updator);
  }

  private useFallback<T extends Action>(action: T) {
    const globalUpdator = this.globalRegistery.getUpdator<any>(action.type);
    if (globalUpdator) {
      this.coordinator.dispatch(action, globalUpdator);
    } else {
      this.dispatcher.emit(action);
    }
  }
}

/**
 * Dispatches an action with optional updator registration.
 *
 * This function provides a flexible way to dispatch actions:
 * - If only an action is provided, it will be dispatched through the ActionDispatcher
 * - If an updator is also provided, it will be registered (if needed) and used to update state
 *
 * @template T - The action type.
 * @template S - The state type (inferred from updator if provided).
 * @param action - The action to dispatch.
 * @param updator - Optional updator to handle state updates for this action.
 */
export function dispatch<T extends Action>(action: T, context?: object): void;
export function dispatch<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): void;
export function dispatch<T extends Action, S>(
  action: T,
  contextOrUpdator?: object | IUpdator<S>
): void {
  withInjectionContext(() => {
    const dispatchHandler = inject(DispatchHandler);
    dispatchHandler.handle(action, contextOrUpdator);
  });
}
