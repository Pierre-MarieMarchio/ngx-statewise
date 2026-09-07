import { inject, Injectable } from '@angular/core';
import { withInjectionContext } from '../../injector/injection-utils';
import { Action } from '../../action/interfaces/action-type';
import { IUpdator } from '../../updator';
import { DispatchHandler } from './handlers/dispatch.handler';

@Injectable({ providedIn: 'root' })
export class DispatchService {
  private readonly dispatchHandler = inject(DispatchHandler);

  public dispatch<T extends Action, S>(
    action: T,
    contextOrUpdator?: object | IUpdator<S>
  ): void {
    void this.dispatchHandler.start(action, contextOrUpdator).catch((error) => {
      console.error(`Dispatch for ${action.type} failed:`, error);
    });
  }
}

/**
 * Dispatches an action with an optional local context or explicit updator.
 *
 * This function provides a flexible way to dispatch actions:
 * - If only an action is provided, a global updator is resolved when available.
 * - A context selects a locally registered updator.
 * - An explicit updator is used only for this execution and its cascading actions.
 *
 * @template T - The action type.
 * @template S - The state type (inferred from updator if provided).
 * @param action - The action to dispatch.
 * @param contextOrUpdator - Optional local context or explicit updator.
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
    const dispatchService = inject(DispatchService);
    dispatchService.dispatch(action, contextOrUpdator);
  });
}
