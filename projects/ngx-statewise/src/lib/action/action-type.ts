/**
 * Represents an action with no payload.
 *
 * @returns `undefined` — used as a placeholder for actions without data.
 */
export type EmptyPayloadFn = () => undefined;

/**
 * Function that receives and returns a typed payload.
 *
 * @template T - The payload type.
 * @param payload - The input data.
 * @returns The same payload.
 */
export type ValuePayloadFn<T> = (payload: T) => T;

/**
 * Defines a payload function based on the payload type:
 * - If `T` is `undefined`, resolves to `EmptyPayloadFn`.
 * - Otherwise, resolves to `ValuePayloadFn<T>`.
 *
 * @template T - Payload type.
 */
export type SingleAction<T> = T extends undefined
  ? EmptyPayloadFn
  : ValuePayloadFn<T>;

/**
 * Base structure for all actions.
 *
 * @property type - The action type string.
 * @property payload - Optional data attached to the action.
 */
export type Action = {
  type: string;
  payload?: any;
};

/**
 * Converts a CamelCase or PascalCase string to snake_case.
 *
 * @template S - Input string type.
 *
 * @example
 * type A = CamelToSnakeCase<'loadFailure'> // 'load_failure'
 * type B = CamelToSnakeCase<'UserLogin'>   // 'user_login'
 */
export type CamelToSnakeCase<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Tail extends Uncapitalize<Tail>
      ? `${Lowercase<Head>}${CamelToSnakeCase<Tail>}`
      : `${Lowercase<Head>}_${CamelToSnakeCase<Tail>}`
    : S;
