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
    state.isError.set(false);
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
    state.isError.set(true);
  });

  on(authenticateActions.request, (state) => {
    state.isLoading.set(true);
  });

  on(authenticateActions.success, (state, payload) => {
    state.user.set(payload);
    state.isLoggedIn.set(true);
    state.isLoading.set(false);
  });

  /**
   * Not an error state: a visitor with no session reaches this on every cold
   * start, and a banner saying so would be wrong on the landing page.
   */
  on(authenticateActions.failure, (state) => {
    state.isLoading.set(false);
  });

  on(logoutActions.request, (state) => {
    state.isLoading.set(true);
    state.isError.set(false);
  });

  on(logoutActions.success, (state) => {
    state.user.set(null);
    state.isLoggedIn.set(false);
    state.isLoading.set(false);
  });

  /**
   * The group declared this event and nothing handled it, so a failed logout
   * left `isLoading` stuck at true for good. The session is kept, since a
   * logout the server refused did not happen.
   */
  on(logoutActions.failure, (state) => {
    state.isLoading.set(false);
    state.isError.set(true);
  });
});
