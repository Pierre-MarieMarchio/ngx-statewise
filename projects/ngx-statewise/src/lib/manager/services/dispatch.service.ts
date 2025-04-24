import { inject, Injectable } from '@angular/core';
import { withInjectionContext } from '../../../internal/injection-utils';
import { Action } from '../../action/action-type';
import { IUpdator } from '../../updator';
import { DispatchHandler } from './handlers/dispatch.handler';



@Injectable({ providedIn: 'root' })
export class DispatchService {
  private readonly dispatchHandler = inject(DispatchHandler);

  public dispatch<T extends Action, S>(
    action: T,
    contextOrUpdator?: object | IUpdator<S>
  ): void {
    this.dispatchHandler.handle(action, contextOrUpdator);
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
    const dispatchService = inject(DispatchService);
    dispatchService.dispatch(action, contextOrUpdator);
  });
}
