import { inject, Injectable } from '@angular/core';
import { withInjectionContext } from '../../injector/injection-utils';
import { Action } from '../../action/interfaces/action-type';
import { IUpdator } from '../../updator';
import { DispatchAsyncHandler } from './handlers/dispatchAsync.handler';

@Injectable({ providedIn: 'root' })
export class DispatchAsyncService {
  private readonly dispatchAsynHandler = inject(DispatchAsyncHandler);

  public dispatchAsync<T extends Action, S>(
    action: T,
    contextOrUpdator?: object | IUpdator<S>
  ): Promise<void> {
    return this.dispatchAsynHandler.handle(action, contextOrUpdator);
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
    const dispatchAsyncService = inject(DispatchAsyncService);
    return dispatchAsyncService.dispatchAsync(action, contextOrUpdator);
  });
}
