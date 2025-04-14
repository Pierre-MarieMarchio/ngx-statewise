import {
  Observable,
  mergeMap,
  tap,
  catchError,
  EMPTY,
  shareReplay,
} from 'rxjs';
import { Action } from '../action';
import { EffectHandler } from './effect-handler';

/**
 * Creates an effect that reacts to a specific action and executes a handler.
 *
 * This function has two overloads:
 * 1. For actions with payload: where the handler receives the action's payload
 * 2. For actions without payload: where the handler receives no arguments
 *
 *
 * @param action - The action creator function this effect should react to
 * @param handler - The handler to execute when the action is triggered
 *
 * @returns An Observable that emits the resulting actions from the handler
 */
export function createEffect<T extends (payload: any) => Action>(
  action: T,
  handler: (payload: Parameters<T>[0]) => Observable<Action>
): Observable<Action>;

/**
 * Overload for actions without payload.
 *
 * @param action - The action creator function without payload
 * @param handler - The handler to execute without receiving a payload
 *
 * @returns An Observable that emits the resulting actions from the handler
 */
export function createEffect(
  action: () => Action,
  handler: () => Observable<Action>
): Observable<Action>;

/**
 * Actual implementation that handles both use cases.
 *
 * @param action - The action creator function
 * @param handler - The handler to execute
 *
 * @returns An Observable that emits the resulting actions from the handler
 */
export function createEffect(
  action: () => Action,
  handler: (payload?: any) => Observable<Action>
): Observable<Action> {
  const dummyAction = (action as Function)({} as any);
  const actionType = dummyAction.type;

  const effectHandler = EffectHandler.getInstance();

  const effect = effectHandler.ofType<Action>(actionType).pipe(
    mergeMap((action) => {
      return handler(action.payload).pipe(
        tap((resultAction) => {
          effectHandler.emit(resultAction);
        })
      );
    }),

    catchError((error) => {
      console.error(`Effect for ${actionType} failed:`, error);
      return EMPTY;
    }),

    shareReplay({
      bufferSize: 1,
      refCount: true,
    })
  );

  effect.subscribe();
  return effect;
}
