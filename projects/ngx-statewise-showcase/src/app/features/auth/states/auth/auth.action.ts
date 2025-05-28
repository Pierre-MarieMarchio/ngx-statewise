import { defineActionsGroup, emptyPayload, payload } from 'ngx-statewise';
import { LoginResponses, LoginSubmit } from '../../models';
import { User } from '@shared/app-common/models';

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

export const logoutActions = defineActionsGroup({
  source: 'LOGOUT',
  events: {
    request: emptyPayload,
    success: emptyPayload,
    failure: emptyPayload,
  },
});
