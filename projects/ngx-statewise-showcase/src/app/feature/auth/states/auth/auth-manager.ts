import { inject, Injectable } from '@angular/core';
import { dispatch, dispatchAsync, registerLocalUpdator } from 'ngx-statewise';
import { AuthStates } from './auth-states';
import {
  authenticateActions,
  loginActions,
  logoutActions,
} from './auth-actions';
import { AuthUpdator } from './auth-updator';
import { IAuthManager } from '@shared/app-common/tokens';
import { LoginSubmit } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class AuthManager implements IAuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly authUpdator = inject(AuthUpdator);

  constructor() {
    registerLocalUpdator(this, this.authUpdator);
  }

  public readonly user = this.authStates.user;
  public readonly isLoggedIn = this.authStates.isLoggedIn;
  public readonly isLoading = this.authStates.isLoading;

  public async login(credential: LoginSubmit): Promise<void> {
    await dispatchAsync(loginActions.request(credential), this);
  }

  public authenticate(): Promise<void> {
    return dispatchAsync(authenticateActions.request(), this);
  }

  public authenticateT(): void {
    dispatch(authenticateActions.request(), this);
  }

  public logout(): void {
    dispatch(logoutActions.request(), this);
  }
}
