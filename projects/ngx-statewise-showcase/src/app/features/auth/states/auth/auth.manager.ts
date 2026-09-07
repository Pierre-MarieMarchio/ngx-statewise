import { inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { AuthState } from './auth.state';
import {
  authenticateActions,
  loginActions,
  logoutActions,
} from './auth.action';
import { authUpdater } from './auth.updater';
import { IAuthManager } from '@shared/app-common/tokens';
import { LoginSubmit } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class AuthManager implements IAuthManager {
  private readonly authStates = inject(AuthState);
  private readonly statewise = injectStatewise(authUpdater);

  public readonly user = this.authStates.user.asReadonly();
  public readonly isLoggedIn = this.authStates.isLoggedIn.asReadonly();
  public readonly isLoading = this.authStates.isLoading.asReadonly();

  public login(credential: LoginSubmit): Promise<void> {
    return this.statewise.dispatchAsync(loginActions.request(credential));
  }

  public authenticate(): Promise<void> {
    return this.statewise.dispatchAsync(authenticateActions.request());
  }

  public logout(): void {
    this.statewise.dispatch(logoutActions.request());
  }
}
