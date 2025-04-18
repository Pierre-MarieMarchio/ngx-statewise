/**
 * Creates a typed Redux-style action object.
 *
 * - If only `type` is provided, returns: `{ type }`.
 * - If `payload` is provided, returns: `{ type, payload }`.
 *
 * @typeParam T - Action type (string literal).
 * @typeParam P - Payload type (optional).
 *
 * @param type - The action's type identifier.
 * @param payload - Optional data to include in the action.
 *
 * @returns An action object with a `type` and optionally a `payload`.
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
