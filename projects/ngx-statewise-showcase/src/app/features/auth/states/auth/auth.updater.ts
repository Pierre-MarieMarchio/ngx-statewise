import { defineUpdater } from 'ngx-statewise';
import { AuthState } from './auth.state';
import {
  authenticateActions,
  loginActions,
  logoutActions,
} from './auth.action';

export const authUpdater = defineUpdater(AuthState, (on) => {
  on(loginActions.request, (state) => {
    state.isLoading.set(true);
  });

  on(loginActions.success, (state, payload) => {
    state.user.set({
      userId: payload.userId,
      userName: payload.userName,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    });
    state.isLoggedIn.set(true);
    state.isLoading.set(false);
  });

  on(loginActions.failure, (state) => {
    state.user.set(null);
    state.isLoggedIn.set(false);
    state.isLoading.set(false);
  });

  on(authenticateActions.request, (state) => {
    state.isLoading.set(true);
  });

  on(authenticateActions.success, (state, payload) => {
    state.user.set(payload);
    state.isLoggedIn.set(true);
    state.isLoading.set(false);
  });

  on(authenticateActions.failure, (state) => {
    state.isLoading.set(false);
  });

  on(logoutActions.request, (state) => {
    state.isLoading.set(true);
  });

  on(logoutActions.success, (state) => {
    state.user.set(null);
    state.isLoggedIn.set(false);
    state.isLoading.set(false);
  });
});
