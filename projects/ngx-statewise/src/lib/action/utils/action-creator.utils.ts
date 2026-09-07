import {
  CreatorFromDefinition,
  PayloadDefinition,
} from '../interfaces/action-type';
import { emptyPayload } from './action.utils';

export function createActionCreator<
  Type extends string,
  Definition extends PayloadDefinition
>(
  type: Type,
  payloadDefinition: Definition
): CreatorFromDefinition<Type, Definition> {
  const creator = payloadDefinition === emptyPayload
    ? () => ({ type })
    : (payload: unknown) => {
        const mapPayload = payloadDefinition as (value: unknown) => unknown;
        const mappedPayload = mapPayload(payload);

        return mappedPayload === undefined
          ? { type }
          : { type, payload: mappedPayload };
      };

  return Object.assign(creator, { type }) as CreatorFromDefinition<
    Type,
    Definition
  >;
}
