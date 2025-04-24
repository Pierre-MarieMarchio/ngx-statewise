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

