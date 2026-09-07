import type { Action, ActionWithPayload, EmptyAction } from './action';
import type { GroupActionType } from './action-type-name';
import {
  emptyPayload,
  type EmptyPayloadFn,
  type PayloadDefinition,
} from './payload';

/** Builds an action carrying no payload. */
export type EmptyActionCreator<Type extends string> =
  (() => EmptyAction<Type>) & {
    type: Type;
  };

/** Builds an action carrying a payload. */
export type PayloadActionCreator<
  Type extends string,
  Input,
  Payload = Input,
> = ((payload: Input) => ActionWithPayload<Type, Payload>) & {
  type: Type;
};

/** Either creator shape, chosen by whether the action carries a payload. */
export type ActionCreator<Type extends string, Payload = never> = [
  Payload,
] extends [never]
  ? EmptyActionCreator<Type>
  : PayloadActionCreator<Type, Payload>;

/** Structural shape shared by every action creator this library produces. */
export type AnyActionCreator = ((...args: never[]) => Action) & {
  readonly type: string;
};

/**
 * Payload carried by the action a creator produces, or `never` when the
 * creator builds an action without payload.
 */
export type ActionPayloadOf<Creator extends AnyActionCreator> =
  ReturnType<Creator> extends { payload: infer Payload } ? Payload : never;

/** The creator a payload declaration produces for a given action type. */
export type CreatorFromDefinition<
  Type extends string,
  Definition extends PayloadDefinition,
> = Definition extends EmptyPayloadFn
  ? EmptyActionCreator<Type>
  : Definition extends (payload: infer Input) => infer Payload
    ? PayloadActionCreator<Type, Input, Payload>
    : never;

/** Every creator of an action group, keyed by event name. */
export type ActionCreatorsGroup<
  Source extends string,
  Events extends Record<string, PayloadDefinition>,
> = {
  [EventName in keyof Events]: CreatorFromDefinition<
    GroupActionType<Source, EventName & string>,
    Events[EventName]
  >;
};

/**
 * Builds the creator for one action type. A declaration mapping its argument
 * to `undefined` produces an action without payload.
 */
export function createActionCreator<
  Type extends string,
  Definition extends PayloadDefinition,
>(
  type: Type,
  payloadDefinition: Definition,
): CreatorFromDefinition<Type, Definition> {
  const creator =
    payloadDefinition === emptyPayload
      ? () => ({ type })
      : (value: unknown) => {
          const mapPayload = payloadDefinition as (input: unknown) => unknown;
          const mapped = mapPayload(value);

          return mapped === undefined ? { type } : { type, payload: mapped };
        };

  return Object.assign(creator, { type }) as CreatorFromDefinition<
    Type,
    Definition
  >;
}
