import { defineActionsGroup, emptyPayload, payload } from 'ngx-statewise';
import { LoginResponses, LoginSubmit } from '../../models';
import { User } from '../../models';

export const loginActions = defineActionsGroup({
  source: 'LOGIN',
  events: {
    request: payload<LoginSubmit>(),
    success: payload<LoginResponses>(),
    failure: emptyPayload,
  },
});

export const authenticateActions = defineActionsGroup({
  source: 'AUTHENTICATE',
  events: {
    request: emptyPayload,
    success: payload<User>(),
    failure: emptyPayload,
  },
});

/**
 * Who else is in the organisation, asked for once a session exists.
 *
 * The request carries the id it needs rather than reading it back off the
 * state: the two effects that start this cascade have just been handed the
 * user, and an action that says what it is about is one less thing to look up.
 */
export const getMembersActions = defineActionsGroup({
  source: 'GET_MEMBERS',
  events: {
    request: payload<string>(),
    success: payload<User[]>(),
    failure: emptyPayload,
  },
});

export const logoutActions = defineActionsGroup({
  source: 'LOGOUT',
  events: {
    request: emptyPayload,
    success: emptyPayload,
    failure: emptyPayload,
  },
});
