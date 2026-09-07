import {
  defineActionsGroup,
  defineSingleAction,
} from './action.service';
import { emptyPayload, ofType, payload } from '../utils/action.utils';

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;

function expectType<Value extends true>(): void {}

describe('action creators', () => {
  it('creates payload and empty actions while preserving the public shape', () => {
    const actions = defineActionsGroup({
      source: 'user',
      events: {
        loadRequest: payload<{ id: number }>(),
        loadSuccess: emptyPayload,
      },
    });

    const request = actions.loadRequest({ id: 42 });
    const success = actions.loadSuccess();

    expect(request).toEqual({
      type: 'USER_LOAD_REQUEST',
      payload: { id: 42 },
    });
    expect(success).toEqual({ type: 'USER_LOAD_SUCCESS' });
    expect(actions.loadRequest.type).toBe('USER_LOAD_REQUEST');
    expect(actions.loadSuccess.type).toBe('USER_LOAD_SUCCESS');

    expectType<Equal<typeof request.type, 'USER_LOAD_REQUEST'>>();
    expectType<Equal<typeof request.payload, { id: number }>>();
    expectType<Equal<typeof success.type, 'USER_LOAD_SUCCESS'>>();
  });

  it('preserves the 0.6.4 action strings for acronyms and digits', () => {
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

    expectType<
      Equal<typeof actions.loadHTTPResponse.type, 'API_LOAD_HTTPRESPONSE'>
    >();
    expectType<
      Equal<typeof actions.parseURL2Value.type, 'API_PARSE_URL2VALUE'>
    >();
    expectType<
      Equal<typeof actions.XMLHttpRequest.type, 'API_XMLHTTP_REQUEST'>
    >();
    expectType<Equal<typeof actions.HTTPError.type, 'API_HTTPERROR'>>();
  });

  it('preserves defineSingleAction(...).action and mapped payloads', () => {
    const reset = defineSingleAction('TASK_RESET', emptyPayload);
    const select = defineSingleAction(
      'SELECT_TASK',
      (id: string) => Number(id)
    );

    expect(reset.action()).toEqual({ type: 'TASK_RESET_ACTION' });
    expect(select.action('42')).toEqual({
      type: 'SELECT_TASK_ACTION',
      payload: 42,
    });
    expect(reset.action.type).toBe('TASK_RESET_ACTION');
    expect(select.action.type).toBe('SELECT_TASK_ACTION');

    expectType<Equal<typeof reset.action.type, 'TASK_RESET_ACTION'>>();
    expectType<Equal<typeof select.action.type, 'SELECT_TASK_ACTION'>>();
  });

  it('returns a literal type from creators and action objects', () => {
    const action = defineSingleAction('LOGOUT', emptyPayload);

    const creatorType = ofType(action.action);
    const instanceType = ofType(action.action());

    expect(creatorType).toBe('LOGOUT_ACTION');
    expect(instanceType).toBe('LOGOUT_ACTION');
    expectType<Equal<typeof creatorType, 'LOGOUT_ACTION'>>();
    expectType<Equal<typeof instanceType, 'LOGOUT_ACTION'>>();
  });
});
