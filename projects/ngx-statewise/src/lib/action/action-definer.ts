import { SingleAction, EmptyPayloadFn, ValuePayloadFn } from './action-type';
import { emptyPayload } from './action-utils';
import { createAction } from './action-creator';

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

export function defineActionsGroup<
  Source extends string,
  Events extends Record<string, SingleAction<any>>
>(config: {
  source: Source;
  events: Events;
}): {
  [K in keyof Events]: Events[K] extends EmptyPayloadFn
    ? () => { type: `${Uppercase<Source>}_${Uppercase<string & K>}` }
    : (payload: Parameters<Events[K]>[0]) => {
        type: `${Uppercase<Source>}_${Uppercase<string & K>}`;
        payload: Parameters<Events[K]>[0];
      };
} {
  const { source, events } = config;

  const result = {} as any;

  for (const key in events) {
    const type = `${source}_${key}`.toUpperCase();
    result[key] = DefinedAction(type, events[key]);
  }

  return result;
}

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
