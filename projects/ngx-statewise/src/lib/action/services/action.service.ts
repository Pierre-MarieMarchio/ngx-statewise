import { SingleAction } from '../interfaces/action-type';
import { ActionGroupHandler } from './handlers/action-group.handler';
import { SingleActionHandler } from './handlers/single-action.handler';


export class ActionService {

  public static defineActionsGroup<
    Source extends string,
    Events extends Record<string, SingleAction<any>>
  >(config: { source: Source; events: Events }) {
    return ActionGroupHandler.handle(config);
  }

  public static defineSingleAction<Source extends string, ActionPayload>(
    source: Source,
    payload: SingleAction<ActionPayload>
  ) {
    return SingleActionHandler.handle(source, payload);
  }
}

/**
 * Defines a group of related actions with a common source
 *
 * This function provides a convenient way to define action groups without
 * directly injecting the ActionService
 *
 * @param config - Object containing source prefix and events map
 * @returns An object with action creators for each event
 */
export function defineActionsGroup<
  Source extends string,
  Events extends Record<string, SingleAction<any>>
>(config: { source: Source; events: Events }) {
  return ActionService.defineActionsGroup(config);
}

/**
 * Defines a single action with a source prefix
 *
 * This function provides a convenient way to define a single action without
 * directly injecting the ActionService
 *
 * @param source - Source prefix for the action type
 * @param payload - Payload handler function
 * @returns An object with an action creator
 */
export function defineSingleAction<Source extends string, ActionPayload>(
  source: Source,
  payload: SingleAction<ActionPayload>
) {
  return ActionService.defineSingleAction(source, payload);
}
