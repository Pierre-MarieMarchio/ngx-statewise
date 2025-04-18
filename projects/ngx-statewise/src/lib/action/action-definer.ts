import { SingleAction, EmptyPayloadFn, ValuePayloadFn, CamelToSnakeCase } from './action-type';
import { emptyPayload, toScreamingSnakeCase } from './action-utils';
import { createAction } from './action-creator';

/**
 * Creates an action creator from a type and a payload handler.
 *
 * @param type - Action type string.
 * @param payloadFn - Function that defines the payload shape.
 *
 * @returns An action creator function:
 * - If no payload is required, returns: `() => { type }`
 * - If payload is required, returns: `(payload) => { type, payload }`
 */
function DefinedAction<T extends string, P>(
  type: T,
  payloadFn: SingleAction<P>
): any {
  let fn: any;

  if (payloadFn === emptyPayload) {
    fn = () => createAction(type);
  } else {
    fn = (payload: P) =>
      createAction(type, (payloadFn as ValuePayloadFn<P>)(payload));
  }

  fn.type = type;
  return fn;
}

/**
 * Generates a group of action creators from a source and event definitions.
 *
 * @param config - Object containing:
 * - `source`: Prefix for all action types.
 * - `events`: Object where keys are event names and values are payload handlers.
 *
 * @returns An object of action creators:
 * - If no payload: `() => { type: 'SOURCE_EVENT' }`
 * - If payload: `(payload) => { type: 'SOURCE_EVENT', payload }`
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
 * Creates a single action creator named `${SOURCE}_ACTION`.
 *
 * @param source - Prefix for the action type.
 * @param payload - Payload handler function.
 *
 * @returns An object with an `action` creator:
 * - If no payload: `() => { type: 'SOURCE_ACTION' }`
 * - If payload: `(payload) => { type: 'SOURCE_ACTION', payload }`
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