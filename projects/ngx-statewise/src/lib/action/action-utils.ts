import { EmptyPayloadFn, ValuePayloadFn } from './action-type';

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