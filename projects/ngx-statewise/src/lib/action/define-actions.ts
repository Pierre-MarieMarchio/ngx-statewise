import {
  createActionCreator,
  type ActionCreatorsGroup,
  type CreatorFromDefinition,
} from './action-creator';
import {
  toScreamingSnakeCase,
  type GroupActionType,
  type SingleActionType,
} from './action-type-name';
import type { PayloadDefinition } from './payload';

/**
 * Declares a group of related actions sharing a source.
 *
 * The type name of each action combines the source and the event name:
 * a source of `login` with an event `request` produces `LOGIN_REQUEST`.
 *
 * @param config - The shared source and the events it declares.
 * @returns One action creator per event.
 */
export function defineActionsGroup<
  Source extends string,
  Events extends Record<string, PayloadDefinition>,
>(config: {
  source: Source;
  events: Events;
}): ActionCreatorsGroup<Source, Events> {
  const creators: Record<string, unknown> = {};

  const events = Object.entries(config.events) as [
    keyof Events & string,
    PayloadDefinition,
  ][];

  for (const [eventName, payloadDefinition] of events) {
    const type = `${config.source.toUpperCase()}_${toScreamingSnakeCase(
      eventName,
    )}` as GroupActionType<Source, typeof eventName>;

    creators[eventName] = createActionCreator(type, payloadDefinition);
  }

  return creators as ActionCreatorsGroup<Source, Events>;
}

/**
 * Declares a standalone action. Its type name is the source suffixed with
 * `_ACTION`, so `LOGOUT` produces `LOGOUT_ACTION`.
 *
 * @param source - The name the action type is built from.
 * @param payloadDefinition - What the action carries, if anything.
 * @returns The action creator itself.
 */
export function defineSingleAction<
  Source extends string,
  Definition extends PayloadDefinition,
>(
  source: Source,
  payloadDefinition: Definition,
): CreatorFromDefinition<SingleActionType<Source>, Definition> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- tsc widens the template literal to `string` without it (TS2322)
  const type = `${source}_ACTION` as SingleActionType<Source>;

  return createActionCreator(type, payloadDefinition);
}
