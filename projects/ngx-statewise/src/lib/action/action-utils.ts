import { Action, EmptyPayloadFn, ValuePayloadFn } from './action-type';

/**
 * Utility function representing an empty payload.
 *
 * Used for actions that do not carry any data.
 *
 * @returns `undefined`
 */
export const emptyPayload: EmptyPayloadFn = () => undefined;

/**
 * Utility function to define a typed payload handler.
 *
 * Returns a function that simply returns the payload it receives.
 *
 * @template T - The type of the payload.
 * @returns A function that takes and returns a payload of type `T`.
 */
export function payload<T>(): ValuePayloadFn<T> {
  return (p: T) => p;
}

/**
 * Converts a camelCase or PascalCase string to SCREAMING_SNAKE_CASE.
 *
 * @param str - The input string in camelCase or PascalCase.
 * @returns The transformed string in SCREAMING_SNAKE_CASE format.
 *
 */
export function toScreamingSnakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
}

export function ofType<T extends (...args: any[]) => Action>(action: T): string;
export function ofType(action: { type: string }): string;
export function ofType(action: any): string {

  if (typeof action === 'function') {
    return action.type;
  }
  return action.type;
}
