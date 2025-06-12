import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  authenticateActions,
  loginActions,
  logoutActions,
} from './auth.action';
import { Router } from '@angular/router';
import { createEffect } from 'ngx-statewise';
import { TokenService } from '@app/core/services/token.service';
import {
  AuthRepositoryService,
  AuthTokenService,
  AuthTokenHelperService,
  AuthNotificationService,
} from '../../services';
import { TASK_MANAGER } from '@shared/app-common/tokens/task-manager/task-manager.token';
import { PROJECT_MANAGER } from '@shared/app-common/tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthEffect {
  private readonly projectManager = inject(PROJECT_MANAGER);
  private readonly taskManager = inject(TASK_MANAGER);
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
      this.projectManager.getAll();
      this.taskManager.getAll();
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
        await Promise.all([
          this.taskManager.reset(),
          this.projectManager.reset(),
          firstValueFrom(this.authRepository.logout()),
        ]);

        return logoutActions.success();
      } catch (error) {
        console.error('Authentication error:', error);
        return logoutActions.failure();
      }
    }
  );

  public readonly logoutSuccessEffect = createEffect(
    logoutActions.success,
    () => {
      this.authToken.clearAccessToken();
      this.authToken.clearRefreshToken();

      this.router.navigate(['/']);
    }
  );

  public readonly logoutFailureEffect = createEffect(
    logoutActions.failure,
    () => {
      this.notification.logoutFailure();
    }
  );
}
