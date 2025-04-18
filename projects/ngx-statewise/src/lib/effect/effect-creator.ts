
import { EffectHandler } from './effect-handler';
import { dispatch } from '../manager';
import { ofType } from '../action/action-utils';
import { Action } from '../action/action-type';
import { getUpdator } from '../updator/updator-registery';
import { firstValueFrom, isObservable, Observable } from 'rxjs';

type SWEffects =
  | Promise<Observable<Action | Action[]> | Action | Action[] | void>
  | Observable<Action | Action[]>
  | Action
  | Action[]
  | void;


/**
 * Creates an effect that reacts to a specific action and executes a handler.
 *
 * @param action - The action creator function
 * @param handler - The handler to execute when the action is triggered
 */
export function createEffect<T extends (payload: any) => Action>(
  action: T,
  handler: (payload: Parameters<T>[0]) => SWEffects
): void;
/**
 * Overload for actions without payload.
 *
 * @param action - The action creator function without payload
 * @param handler - The handler to execute without receiving a payload
 */
export function createEffect(
  action: () => Action,
  handler: () => SWEffects
): void;
/**
 * Actual implementation that handles both use cases.
 *
 * @param action - The action creator function
 * @param handler - The handler to executeSS
 */
export function createEffect(
  action: () => Action,
  handler: (payload?: any) => SWEffects
): void {
  const effectHandler = EffectHandler.getInstance();
  const actionType = ofType(action);

  effectHandler.registerHandler(actionType, async (action: Action) => {
    const effectPromise = createEffectPromise(handler, action, actionType);
    effectHandler.registerPendingEffect(actionType, effectPromise);
    return effectPromise;
  });
}
/**
 * Traite les résultats d'un handler d'effet et dispatche les actions résultantes
 */
function handleEffectResults(
  results: (Action | void)[],
  actionType: string
): Promise<void[]> {
  return Promise.all(
    results
      .filter((a): a is Action => !!a)
      .map(async (resultAction) => {
        const updator = getUpdator(resultAction.type);
        if (updator) {
          dispatch(resultAction, updator);
        } else {
          console.warn(
            `[createEffect] No updator for action "${resultAction.type}", emitting only`
          );
          EffectHandler.getInstance().emit(resultAction);
        }
      })
  );
}

async function resolveEffectResult(
  result: SWEffects
): Promise<(Action | void)[]> {
  if (result instanceof Promise) {
    const awaited = await result;

    // Handle case where Promise resolves to an Observable
    if (isObservable(awaited)) {
      const resolvedObs = await firstValueFrom(awaited);
      return Array.isArray(resolvedObs) ? resolvedObs : [resolvedObs];
    }

    // Handle other Promise results
    return Array.isArray(awaited) ? awaited : [awaited];
  } else if (isObservable(result)) {
    const resolved = await firstValueFrom(result);
    return Array.isArray(resolved) ? resolved : [resolved];
  } else if (Array.isArray(result)) {
    return result;
  } else {
    // Direct Action or void
    return [result];
  }
}

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
