import { inject, Injectable } from '@angular/core';
import { IUpdator, ofType, UpdatorRegistry } from 'ngx-statewise';
import { AuthState } from './auth.state';
import {
  loginActions,
  authenticateActions,
  logoutActions,
} from './auth.action';
import { LoginResponses } from '../../models';
import { User } from '@shared/app-common/models';

@Injectable({
  providedIn: 'root',
})
export class AuthUpdator implements IUpdator<AuthState> {
  public readonly state = inject(AuthState);

  public readonly updators: UpdatorRegistry<AuthState> = {
    [ofType(loginActions.request)]: (state) => {
      state.isLoading.set(true);
    },

    [ofType(loginActions.success)]: (state, payload: LoginResponses) => {
      state.user.set({
        userId: payload.userId,
        userName: payload.userName,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
      });
      state.isLoggedIn.set(true);
      state.isLoading.set(false);
    },

    [ofType(loginActions.failure)]: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.isLoading.set(false);
    },

    [ofType(authenticateActions.request)]: (state) => {
      state.isLoading.set(true);
    },

    [ofType(authenticateActions.success)]: (state, payload: User) => {
      state.user.set(payload);
      state.isLoggedIn.set(true);
      state.isLoading.set(false);
    },

    [ofType(authenticateActions.failure)]: (state) => {
      state.isLoading.set(false);
    },

    [ofType(logoutActions.request)]: (state) => {
      state.isLoading.set(true);
    },

    [ofType(logoutActions.success)]: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.isLoading.set(false);
    },
  };
}
