import { inject, Injectable } from '@angular/core';
import { AuthStates } from './auth-states';
import { LoginResponses } from '../interfaces/auth-responses.interfaces';
import { IUpdator, ofType, UpdatorRegistry } from 'ngx-statewise';
import { User } from '../interfaces/auth-user.interface';
import {
  authenticateActions,
  loginActions,
  logoutAction,
} from './auth-actions';

@Injectable({
  providedIn: 'root',
})
export class AuthUpdator implements IUpdator<AuthStates> {
  public readonly state = inject(AuthStates);

  public readonly updators: UpdatorRegistry<AuthStates> = {
    [ofType(loginActions.request)]: (state) => {
      state.isLoading.set(true);
      state.asError.set(false);
    },
    [ofType(loginActions.success)]: (state, payload: LoginResponses) => {
      state.user.set({
        userId: payload.userId,
        userName: payload.userName,
        email: payload.email,
      });
      state.isLoggedIn.set(true);
      state.isLoading.set(false);
    },
    [ofType(loginActions.failure)]: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.asError.set(true);
      state.isLoading.set(false);
    },
    [ofType(logoutAction.action)]: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.asError.set(false);
      state.isLoading.set(false);
    },
    [ofType(authenticateActions.request)]: (state) => {
      state.isLoading.set(true);
      state.asError.set(false);
    },
    [ofType(authenticateActions.success)]: (state, payload: User) => {
      state.user.set(payload);
      state.isLoggedIn.set(true);
      state.isLoading.set(false);
    },
    [ofType(authenticateActions.failure)]: (state) => {
      state.user.set(null);
      state.isLoggedIn.set(false);
      state.isLoading.set(false);
    },
  };
}
