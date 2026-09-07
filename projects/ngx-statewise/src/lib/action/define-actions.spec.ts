import { defineActionsGroup, defineSingleAction } from './define-actions';
import { emptyPayload, payload } from './payload';
import type { Equal, Expect } from '../../spec-helpers/type-assertion';

describe('defineActionsGroup', () => {
  it('builds one creator per event, with and without payload', () => {
    const actions = defineActionsGroup({
      source: 'user',
      events: {
        loadRequest: payload<{ id: number }>(),
        loadSuccess: emptyPayload,
      },
    });

    const request = actions.loadRequest({ id: 42 });
    const success = actions.loadSuccess();

    expect(request).toEqual({ type: 'USER_LOAD_REQUEST', payload: { id: 42 } });
    expect(success).toEqual({ type: 'USER_LOAD_SUCCESS' });
    expect(actions.loadRequest.type).toBe('USER_LOAD_REQUEST');
    expect(actions.loadSuccess.type).toBe('USER_LOAD_SUCCESS');

    type _RequestType = Expect<Equal<typeof request.type, 'USER_LOAD_REQUEST'>>;
    type _RequestPayload = Expect<
      Equal<typeof request.payload, { id: number }>
    >;
    type _SuccessType = Expect<Equal<typeof success.type, 'USER_LOAD_SUCCESS'>>;
  });

  it('preserves the 0.6.4 type names for acronyms and digits', () => {
    const actions = defineActionsGroup({
      source: 'api',
      events: {
        loadHTTPResponse: emptyPayload,
        parseURL2Value: emptyPayload,
        XMLHttpRequest: emptyPayload,
        HTTPError: emptyPayload,
      },
    });

    expect(actions.loadHTTPResponse.type).toBe('API_LOAD_HTTPRESPONSE');
    expect(actions.parseURL2Value.type).toBe('API_PARSE_URL2VALUE');
    expect(actions.XMLHttpRequest.type).toBe('API_XMLHTTP_REQUEST');
    expect(actions.HTTPError.type).toBe('API_HTTPERROR');

    type _Acronym = Expect<
      Equal<typeof actions.loadHTTPResponse.type, 'API_LOAD_HTTPRESPONSE'>
    >;
    type _Digit = Expect<
      Equal<typeof actions.parseURL2Value.type, 'API_PARSE_URL2VALUE'>
    >;
    type _Leading = Expect<
      Equal<typeof actions.XMLHttpRequest.type, 'API_XMLHTTP_REQUEST'>
    >;
    type _Whole = Expect<Equal<typeof actions.HTTPError.type, 'API_HTTPERROR'>>;
  });

  it('builds nothing from an empty event map', () => {
    expect(defineActionsGroup({ source: 'empty', events: {} })).toEqual({});
  });
});

describe('defineSingleAction', () => {
  it('returns the creator itself, suffixed with _ACTION', () => {
    const reset = defineSingleAction('TASK_RESET', emptyPayload);

    expect(reset()).toEqual({ type: 'TASK_RESET_ACTION' });
    expect(reset.type).toBe('TASK_RESET_ACTION');

    type _ResetType = Expect<Equal<typeof reset.type, 'TASK_RESET_ACTION'>>;
  });

  it('maps its argument into the payload it carries', () => {
    const select = defineSingleAction('SELECT_TASK', (id: string) =>
      Number(id),
    );

    expect(select('42')).toEqual({ type: 'SELECT_TASK_ACTION', payload: 42 });

    type _SelectType = Expect<Equal<typeof select.type, 'SELECT_TASK_ACTION'>>;
  });

  it('omits the payload when the declaration maps it to nothing', () => {
    const ignored = defineSingleAction(
      'IGNORED',
      (_value: string) => undefined,
    );
    const action: { type: string; payload?: unknown } = ignored('dropped');

    expect(action).toEqual({ type: 'IGNORED_ACTION' });
    expect('payload' in action).toBeFalse();
  });
});
