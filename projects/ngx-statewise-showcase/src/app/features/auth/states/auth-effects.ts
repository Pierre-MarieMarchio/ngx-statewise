import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  authenticateActions,
  loginActions,
  logoutActions,
} from './auth-actions';
import { Router } from '@angular/router';
import { createEffect } from 'ngx-statewise';
import {
  AuthRepositoryService,
  AuthTokenService,
  AuthTokenHelperService,
} from '../services';
import { AuthNotificationService } from '../services/auth-notification.service';
import { TokenService } from '@app/core/services/token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private readonly authRepository = inject(AuthRepositoryService);
  private readonly authToken = inject(AuthTokenService);
  private readonly authTokenHelper = inject(AuthTokenHelperService);
  private readonly router = inject(Router);
  private readonly notification = inject(AuthNotificationService);
  private readonly tokenFactory = inject(TokenService);

  public readonly loginRequestEffect = createEffect(
    loginActions.request,
    async (payload) => {
      try {
        const res = await firstValueFrom(this.authRepository.login(payload));

        this.authToken.setAccessToken(res.body?.accessToken!);
        this.authToken.setRefreshToken(this.tokenFactory.generateJWT());

        return loginActions.success(res.body!);
      } catch {
        return loginActions.failure();
      }
    }
  );

  public readonly loginSuccessEffect = createEffect(
    loginActions.success,
    () => {
      this.router.navigate(['/']);
      this.notification.loginSuccess();
    }
  );

  public readonly loginFailureEffect = createEffect(
    loginActions.failure,
    () => {
      this.notification.loginFailure();
    }
  );

  public readonly authenticateRequestEffect = createEffect(
    authenticateActions.request,
    async () => {
      const accessToken = this.authToken.getAccessToken();
      const refreshToken = this.authToken.getRefreshToken();

      if (!refreshToken) {
        return authenticateActions.failure();
      }

      if (!accessToken) {
        try {
          const res = await firstValueFrom(this.authRepository.authenticate());
          const newToken = this.authToken.setNewAccessTokenFromResponse(res);
          const decoded = this.authTokenHelper.decode(newToken);

          return decoded
            ? authenticateActions.success(
                this.authTokenHelper.getPayload(decoded)
              )
            : authenticateActions.failure();
        } catch (error) {
          console.error('Authentication error:', error);
          return authenticateActions.failure();
        }
      } else {
        const decoded = this.authTokenHelper.decode(accessToken);
        const now = Math.floor(Date.now() / 1000);

        if (!decoded || (decoded.exp && decoded.exp < now)) {
          return authenticateActions.failure();
        }

        return authenticateActions.success(
          this.authTokenHelper.getPayload(decoded)
        );
      }
    }
  );

  public readonly authenticateFailureEffect = createEffect(
    authenticateActions.failure,
    () => {
      if (this.router.url !== '/') {
        this.notification.AuthenticateFailure();
      }

      const refreshToken = this.authToken.getRefreshToken();
      if (!refreshToken) {
        return;
      }

      return logoutActions.request();
    }
  );

  public readonly logoutRequestEffect = createEffect(
    logoutActions.request,
    async () => {
      try {
        await firstValueFrom(this.authRepository.logout());
        return logoutActions.success();
      } catch (error) {
        console.error('Authentication error:', error);
        return logoutActions.failure();
      }
    }
  );

  public readonly logoutSuccessEffect = createEffect(
    logoutActions.success,
    async () => {
      this.authToken.clearAccessToken();
      this.authToken.clearRefreshToken();
      this.router.navigate(['/']);
    }
  );

  public readonly logoutFailureEffect = createEffect(
    logoutActions.failure,
    async () => {
      this.notification.logoutFailure();
    }
  );
}
