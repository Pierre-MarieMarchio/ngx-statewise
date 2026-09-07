import {
  ActionCreatorsGroup,
  CreatorFromDefinition,
  GroupActionType,
  PayloadDefinition,
  SingleActionType,
} from '../interfaces/action-type';
import { createActionCreator } from '../utils/action-creator.utils';
import { toScreamingSnakeCase } from '../utils/action.utils';

/**
 * Defines a group of related actions with a common source
 *
 * @param config - Object containing source prefix and events map
 * @returns An object with action creators for each event
 */
export function defineActionsGroup<
  Source extends string,
  Events extends Record<string, PayloadDefinition>
>(config: {
  source: Source;
  events: Events;
}): ActionCreatorsGroup<Source, Events> {
  const creators: Record<string, unknown> = {};

  for (const eventName of Object.keys(config.events) as Array<
    keyof Events & string
  >) {
    const type = `${config.source.toUpperCase()}_${toScreamingSnakeCase(
      eventName
    )}` as GroupActionType<Source, typeof eventName>;

    creators[eventName] = createActionCreator(type, config.events[eventName]);
  }

  return creators as ActionCreatorsGroup<Source, Events>;
}

/**
 * Defines a single action with a source prefix
 *
 * @param source - Source prefix for the action type
 * @param payload - Payload handler function
 * @returns An object with an action creator
 */
export function defineSingleAction<
  Source extends string,
  Definition extends PayloadDefinition
>(
  source: Source,
  payloadDefinition: Definition
): {
  action: CreatorFromDefinition<SingleActionType<Source>, Definition>;
} {
  const type = `${source}_ACTION` as SingleActionType<Source>;

  return {
    action: createActionCreator(type, payloadDefinition),
  };
}
