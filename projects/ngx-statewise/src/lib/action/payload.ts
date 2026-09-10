/**
 * Declares an action without data.
 *
 * @returns `undefined`, the marker for actions carrying no payload.
 */
export type EmptyPayloadFn = () => undefined;

/**
 * Maps the argument given to an action creator into the payload it carries.
 *
 * @template T - The payload type.
 */
export type ValuePayloadFn<T> = (payload: T) => T;

/** Either shape accepted when declaring what an action carries. */
export type PayloadDefinition = EmptyPayloadFn | ((payload: never) => unknown);

/** Declares an action without data. */
export const emptyPayload: EmptyPayloadFn = () => undefined;

/**
 * Declares the payload type an action carries.
 *
 * @template T - The expected payload type.
 * @returns The identity function the creator applies to its argument.
 */
export function payload<T>(): ValuePayloadFn<T> {
  return (value: T) => value;
}
