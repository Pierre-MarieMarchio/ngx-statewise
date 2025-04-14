/**
 * A function that represents an action with no payload.
 *
 * @returns `undefined` (used as a placeholder for empty actions).
 */
export type EmptyPayloadFn = () => undefined;

/**
 * A function that receives a payload and returns it.
 *
 * @template T - The payload type.
 * @param payload - The payload data.
 * @returns The same payload.
 */
export type ValuePayloadFn<T> = (payload: T) => T;

/**
 * Represents a payload function that adapts to the type:
 * - If `T` is `undefined`, it's an `EmptyPayloadFn`.
 * - Otherwise, it's a `ValuePayloadFn<T>`.
 *
 * @template T - The payload type.
 */
export type SingleAction<T> = T extends undefined
  ? EmptyPayloadFn
  : ValuePayloadFn<T>;

/**
 * Base action type used in the system.
 *
 * - Always has a `type` string.
 * - Optionally has a `payload` (type `any`).
 */
export type Action = {
  type: string;
  payload?: any;
};
