/**
 * Creates a typed action object.
 *
 * Overload 1: Action without payload.
 * Overload 2: Action with payload.
 *
 * @param type - The action type.
 * @param payload - (Optional) The payload to attach to the action.
 *
 * @returns An action object with a `type` property and optionally a `payload` property.
 */
export function createAction<T extends string>(type: T): { type: T };
export function createAction<T extends string, P>(
  type: T,
  payload: P
): { type: T; payload: P };
export function createAction<T extends string, P>(
  type: T,
  payload?: P
): { type: T; payload?: P } {
  return payload === undefined ? { type } : { type, payload };
}
