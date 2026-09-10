import type { Action } from './action';

/**
 * Reads the type name of an action creator or of an action.
 *
 * @example
 * ofType(loginActions.request)    // 'LOGIN_REQUEST'
 * ofType({ type: 'MY_ACTION' })   // 'MY_ACTION'
 */
export function ofType<Type extends string>(action: { type: Type }): Type;
export function ofType<Creator extends (...args: never[]) => Action>(
  action: Creator,
): ReturnType<Creator>['type'];
export function ofType(
  action: { type: string } | ((...args: never[]) => Action),
): string {
  return (action as { type: string }).type;
}
