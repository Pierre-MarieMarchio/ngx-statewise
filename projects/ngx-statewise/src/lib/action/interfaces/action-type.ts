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

export type PayloadDefinition =
  | EmptyPayloadFn
  | ((payload: never) => unknown);

/** Base structure accepted by the execution engine. */
export type Action<
  Type extends string = string,
  Payload = unknown
> = {
  type: Type;
  payload?: Payload;
};

export type EmptyAction<Type extends string> = {
  type: Type;
};

export type ActionWithPayload<Type extends string, Payload> = {
  type: Type;
  payload: Payload;
};

export type EmptyActionCreator<Type extends string> =
  (() => EmptyAction<Type>) & { type: Type };

export type PayloadActionCreator<
  Type extends string,
  Input,
  Payload = Input
> = ((payload: Input) => ActionWithPayload<Type, Payload>) & {
    type: Type;
  };

export type ActionCreator<Type extends string, Payload = never> =
  [Payload] extends [never]
    ? EmptyActionCreator<Type>
    : PayloadActionCreator<Type, Payload>;

type AsciiLowercase =
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l'
  | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x'
  | 'y' | 'z';

type AsciiUppercase = Uppercase<AsciiLowercase>;

/**
 * Mirrors `/([a-z])([A-Z])/g` followed by `toUpperCase()` at type level.
 */
export type ScreamingSnakeCase<
  Value extends string,
  Previous extends string = ''
> = string extends Value
  ? Uppercase<Value>
  : Value extends `${infer Current}${infer Rest}`
    ? `${Previous extends AsciiLowercase
        ? Current extends AsciiUppercase
          ? '_'
          : ''
        : ''}${Uppercase<Current>}${ScreamingSnakeCase<Rest, Current>}`
    : '';

export type GroupActionType<
  Source extends string,
  EventName extends string
> = `${Uppercase<Source>}_${ScreamingSnakeCase<EventName>}`;

export type SingleActionType<Source extends string> = `${Source}_ACTION`;

export type CreatorFromDefinition<
  Type extends string,
  Definition extends PayloadDefinition
> = Definition extends EmptyPayloadFn
  ? EmptyActionCreator<Type>
  : Definition extends (payload: infer Input) => infer Payload
    ? PayloadActionCreator<Type, Input, Payload>
    : never;

export type ActionCreatorsGroup<
  Source extends string,
  Events extends Record<string, PayloadDefinition>
> = {
  [EventName in keyof Events]: CreatorFromDefinition<
    GroupActionType<Source, EventName & string>,
    Events[EventName]
  >;
};
