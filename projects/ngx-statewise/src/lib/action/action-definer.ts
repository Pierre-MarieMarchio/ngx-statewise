import { SingleAction, EmptyPayloadFn, ValuePayloadFn } from './action-type';
import { emptyPayload } from './action-utils';
import { createAction } from './action-creator';

export function defineAction<T extends string>(
  type: T,
  payloadFn: EmptyPayloadFn
): () => { type: T };
export function defineAction<T extends string, P>(
  type: T,
  payloadFn: ValuePayloadFn<P>
): (payload: P) => { type: T; payload: P };
export function defineAction<T extends string, P>(
  type: T,
  payloadFn: EmptyPayloadFn | ValuePayloadFn<P>
) {
  if (payloadFn === emptyPayload) {
    return () => createAction(type);
  }
  return (payload: P) => createAction(type, payloadFn(payload));
}

export function defineActionsGroupe<
  Source extends string,
  ReqPayload,
  SuccessPayload,
  FailurePayload
>(config: {
  source: Source;
  events: {
    request: SingleAction<ReqPayload>;
    success: SingleAction<SuccessPayload>;
    failure: SingleAction<FailurePayload>;
  };
}): {
  request: ReqPayload extends undefined
    ? () => { type: `${Source}_REQUEST` }
    : (payload: ReqPayload) => {
        type: `${Source}_REQUEST`;
        payload: ReqPayload;
      };
  success: SuccessPayload extends undefined
    ? () => { type: `${Source}_SUCCESS` }
    : (payload: SuccessPayload) => {
        type: `${Source}_SUCCESS`;
        payload: SuccessPayload;
      };
  failure: FailurePayload extends undefined
    ? () => { type: `${Source}_FAILURE` }
    : (payload: FailurePayload) => {
        type: `${Source}_FAILURE`;
        payload: FailurePayload;
      };
} {
  const { source, events } = config;
  return {
    request: createDefinedAction(`${source}_REQUEST`, events.request),
    success: createDefinedAction(`${source}_SUCCESS`, events.success),
    failure: createDefinedAction(`${source}_FAILURE`, events.failure),
  } as any;
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
    action: createDefinedAction(`${source}_ACTION`, payload),
  } as any;
}

function createDefinedAction<T extends string, P>(
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
