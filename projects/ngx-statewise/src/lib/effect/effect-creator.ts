import { Action } from '../action';
import { EffectHandler } from './effect-handler';
import { getUpdator } from '../updator';
import { dispatch } from '../manager';

type SWEffects = Promise<Action | Action[] | void> | Action | Action[] | void;

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
  const dummyAction = (action as Function)({} as any);
  const actionType = dummyAction.type;
  const effectHandler = EffectHandler.getInstance();

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

/**
 * Crée et exécute une promesse pour un handler d'effet
 */
function createEffectPromise(
  handler: (payload?: any) => SWEffects,
  action: Action,
  actionType: string
): Promise<void> {
  return (async () => {
    try {
      const result = await handler(action.payload);
      const results = Array.isArray(result) ? result : [result];
      await handleEffectResults(results, actionType);
    } catch (error) {
      console.error(`Effect for ${actionType} failed:`, error);
    }
  })();
}

/**
 * Crée un effet qui réagit à une action spécifique.
 */
