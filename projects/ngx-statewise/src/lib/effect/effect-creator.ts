import { dispatch } from '../manager';
import { ofType } from '../action/action-utils';
import { Action } from '../action/action-type';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { EffectManager } from './effect-manager';
import { ActionDispatcher } from '../action/action-dispatcher';
import { UpdatorRegistry } from '../updator/updator-registery';

/**
 * Supported return types for an effect handler.
 *
 * Can be:
 * - A single action or an array of actions.
 * - An Observable emitting an action or array of actions.
 * - A Promise resolving to any of the above.
 * - Or `void`.
 */
type SWEffects =
  | Promise<Observable<Action | Action[]> | Action | Action[] | void>
  | Observable<Action | Action[]>
  | Action
  | Action[]
  | void;

/**
 * Registers an effect that listens to a specific action and executes a handler.
 *
 * @param action - The action creator function.
 * @param handler - A function called when the action is dispatched.
 * - Receives the payload if the action defines one.
 * - Can return an action, array of actions, observable, or promise.
 */
export function createEffect<T extends (payload: any) => Action>(
  action: T,
  handler: (payload: Parameters<T>[0]) => SWEffects
): void;

/**
 * Registers an effect for an action without payload.
 *
 * @param action - Action creator with no payload.
 * @param handler - Function executed when the action is dispatched.
 */
export function createEffect(
  action: () => Action,
  handler: () => SWEffects
): void;

/**
 * Internal implementation of `createEffect`, handling both payload and no-payload cases.
 */
export function createEffect(
  action: () => Action,
  handler: (payload?: any) => SWEffects
): void {
  const effectHandler = EffectManager.getInstance();
  const actionDispatcher = ActionDispatcher.getInstance();
  const actionType = ofType(action);

  actionDispatcher.registerHandler(actionType, async (action: Action) => {
    const effectPromise = createEffectPromise(handler, action, actionType);
    effectHandler.register(actionType, effectPromise);
    return effectPromise;
  });
}

/**
 * Handles the result of an effect handler and dispatches the corresponding actions.
 *
 * @param results - List of actions returned by the handler.
 * @param actionType - Type of the triggering action (for logging/updating).
 * @returns A Promise that resolves when all results are processed.
 */
function handleEffectResults(
  results: (Action | void)[],
  actionType: string
): Promise<void[]> {
  return Promise.all(
    results
      .filter((a): a is Action => !!a)
      .map(async (resultAction) => {
        const updator = UpdatorRegistry.getInstance().getUpdator(
          resultAction.type
        );
        if (updator) {
          dispatch(resultAction, updator);
        } else {
          console.warn(
            `[createEffect] No updator for action "${resultAction.type}", emitting only`
          );
          ActionDispatcher.getInstance().emit(resultAction);
        }
      })
  );
}

/**
 * Resolves the result of an effect handler into a flat array of actions.
 *
 * Handles:
 * - Promises (with optional Observables inside).
 * - Observables.
 * - Direct actions or arrays.
 * - `void`.
 *
 * @param result - The raw result returned by a handler.
 * @returns A Promise resolving to an array of actions or empty array.
 */
async function resolveEffectResult(
  result: SWEffects
): Promise<(Action | void)[]> {
  if (result instanceof Promise) {
    const awaited = await result;

    if (isObservable(awaited)) {
      const resolvedObs = await firstValueFrom(awaited);
      return Array.isArray(resolvedObs) ? resolvedObs : [resolvedObs];
    }

    return Array.isArray(awaited) ? awaited : [awaited];
  } else if (isObservable(result)) {
    const resolved = await firstValueFrom(result);
    return Array.isArray(resolved) ? resolved : [resolved];
  } else if (Array.isArray(result)) {
    return result;
  } else {
    return [result];
  }
}

/**
 * Wraps an effect handler into a Promise and manages execution flow.
 *
 * @param handler - The effect handler function.
 * @param action - The triggering action object.
 * @param actionType - Type of the triggering action (for tracking/logging).
 * @returns A Promise representing the complete lifecycle of the effect.
 */
function createEffectPromise(
  handler: (payload?: any) => SWEffects | Observable<any>,
  action: Action,
  actionType: string
): Promise<void> {
  return (async () => {
    try {
      const rawResult = handler(action.payload);
      const results = await resolveEffectResult(rawResult);
      await handleEffectResults(results, actionType);
    } catch (error) {
      console.error(`Effect for ${actionType} failed:`, error);
    }
  })();
}
