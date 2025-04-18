import { Action, EmptyPayloadFn, ValuePayloadFn } from './action-type';


/**
 * Represents an empty payload for actions without data.
 *
 * @returns `undefined`
 */
export const emptyPayload: EmptyPayloadFn = () => undefined;

/**
 * Creates a typed identity function for payloads.
 *
 * Useful to define payload handlers with a specific type.
 *
 * @template T - The expected payload type.
 * @returns A function that returns the same payload it receives.
 */
export function payload<T>(): ValuePayloadFn<T> {
  return (p: T) => p;
}

/**
 * Converts a camelCase or PascalCase string to SCREAMING_SNAKE_CASE.
 *
 * @param str - The input string.
 * @returns The same string converted to SCREAMING_SNAKE_CASE.
 *
 * @example
 * toScreamingSnakeCase('loadFailure') // 'LOAD_FAILURE'
 * toScreamingSnakeCase('UserLogin')   // 'USER_LOGIN'
 */
export function toScreamingSnakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
}

/**
 * Extracts the action type string from an action creator or object.
 *
 * @param action - Either an action creator (function with `.type`) or an action object.
 * @returns The `type` string.
 *
 * @example
 * ofType(someActionCreator) // 'SOME_ACTION'
 * ofType({ type: 'MY_ACTION' }) // 'MY_ACTION'
 */
export function ofType<T extends (...args: any[]) => Action>(action: T): string;
export function ofType(action: { type: string }): string;
export function ofType(action: any): string {
  if (typeof action === 'function') {
    return action.type;
  }
  return action.type;
}