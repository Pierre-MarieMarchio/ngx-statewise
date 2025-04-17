import { Action } from '../action';
import { EffectHandler } from './effect-handler';
import { getUpdator } from '../updator';
import { dispatch } from '../manager';

/**
 * Creates an effect that reacts to a specific action and executes a handler.
 *
 * @param action - The action creator function
 * @param handler - The handler to execute when the action is triggered
 */
export function createEffect<T extends (payload: any) => Action>(
  action: T,
  handler: (payload: Parameters<T>[0]) => Promise<Action | Action[] | void> | Action | Action[] | void
): void;

/**
 * Overload for actions without payload.
 *
 * @param action - The action creator function without payload
 * @param handler - The handler to execute without receiving a payload
 */
export function createEffect(
  action: () => Action,
  handler: () => Promise<Action | Action[] | void> | Action | Action[] | void
): void;

/**
 * Actual implementation that handles both use cases.
 *
 * @param action - The action creator function
 * @param handler - The handler to executeSS
 */
export function createEffect(
  action: () => Action,
  handler: (
    payload?: any
  ) => Promise<Action | Action[] | void> | Action | Action[] | void
): void {
  const dummyAction = (action as Function)({} as any);
  const actionType = dummyAction.type;
  const effectHandler = EffectHandler.getInstance();

  effectHandler.registerHandler(actionType, async (action: Action) => {
    try {
      const result = await handler(action.payload);

      const results = Array.isArray(result) ? result : [result];
      results
        .filter((a): a is Action => !!a)
        .forEach((resultAction) => {
          const updator = getUpdator(resultAction.type);
          if (updator) {
            dispatch(resultAction, updator);
          } else {
            console.warn(
              `[createEffect] No updator for action "${resultAction.type}", emitting only`
            );
            EffectHandler.getInstance().emit(resultAction);
          }
        });
    } catch (error) {
      console.error(`Effect for ${actionType} failed:`, error);
    }
  });
}