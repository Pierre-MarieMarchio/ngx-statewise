import { SingleAction, EmptyPayloadFn, ValuePayloadFn, CamelToSnakeCase } from './action-type';
import { emptyPayload, toScreamingSnakeCase } from './action-utils';
import { createAction } from './action-creator';

/**
 * Creates a creator from a type and a payload handler.
 *
 * @param type - The action type.
 * @param payloadFn - A function describing the payload signature.
 *
 * @returns A function that returns an action:
 * - If `P` is `undefined`, returns a function `() => { type }`
 * - Otherwise, returns a function `(payload: P) => { type, payload }`
 */
function DefinedAction<T extends string, P>(
  type: T,
  payloadFn: SingleAction<P>
): P extends undefined
  ? () => { type: T }
  : (payload: P) => { type: T; payload: P } {
  if (payloadFn === emptyPayload) {
    return (() => createAction(type)) as any;
  } else {
    return ((payload: P) =>
      createAction(type, (payloadFn as ValuePayloadFn<P>)(payload))) as any;
  }
}

/**
 * Generates a group of actions based on a source and a set of events.
 *
 * @param config - Configuration object:
 *   - `source`: A string prefix for action types.
 *   - `events`: An object describing event names and their payload handlers.
 *
 * @returns An object where each key is an action creator function:
 * - If no payload, the function returns `{ type: `${SOURCE}_${EVENT}` }`
 * - If payload exists, the function returns `{ type: `${SOURCE}_${EVENT}`, payload }`
 */
export function defineActionsGroup<
  Source extends string,
  Events extends Record<string, SingleAction<any>>
>(config: {
  source: Source;
  events: Events;
}): {
  [K in keyof Events]: Events[K] extends EmptyPayloadFn
    ? () => {
        type: `${Uppercase<Source>}_${Uppercase<CamelToSnakeCase<string & K>>}`;
      }
    : (payload: Parameters<Events[K]>[0]) => {
        type: `${Uppercase<Source>}_${Uppercase<CamelToSnakeCase<string & K>>}`;
        payload: Parameters<Events[K]>[0];
      };
} {
  const { source, events } = config;
  const result = {} as any;
  for (const key in events) {
    const type = `${source.toUpperCase()}_${toScreamingSnakeCase(key)}`;
    result[key] = DefinedAction(type, events[key]);
  }
  return result;
}

/**
 * Creates a single action with a fixed name `${SOURCE}_ACTION`.
 *
 * @param source - The source used to prefix the action type.
 * @param payload - The payload handler function.
 *
 * @returns An object containing one action creator:
 * - If no payload: `() => { type: `${SOURCE}_ACTION` }`
 * - With payload: `(payload) => { type: `${SOURCE}_ACTION`, payload }`
 */
export function defineSingleAction<Source extends string, ActionPayload>(
  source: Source,
  payload: SingleAction<ActionPayload>
): {
  action: ActionPayload extends undefined
    ? () => { type: `${Source}_ACTION` }
    : (payload: ActionPayload) => {
        type: `${Source}_ACTION`;
        payload: ActionPayload;
      };
} {
  return {
    action: DefinedAction(`${source}_ACTION`, payload),
  } as any;
}