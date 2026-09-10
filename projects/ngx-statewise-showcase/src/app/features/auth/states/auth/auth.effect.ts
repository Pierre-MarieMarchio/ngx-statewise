import { ErrorHandler, inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  authenticateActions,
  getMembersActions,
  loginActions,
  logoutActions,
} from './auth.action';
import { Router } from '@angular/router';
import { createEffect } from 'ngx-statewise';
import {
  AuthRepositoryService,
  AuthTokenService,
  AuthTokenHelperService,
  AuthNotificationService,
} from '../../services';
import { PROJECT_RELOAD, TASK_RELOAD } from '@app/features/common';

@Injectable({
  providedIn: 'root',
})
export class AuthEffect {
  private readonly projectManager = inject(PROJECT_RELOAD);
  private readonly taskManager = inject(TASK_RELOAD);
  private readonly authRepository = inject(AuthRepositoryService);
  private readonly authToken = inject(AuthTokenService);
  private readonly authTokenHelper = inject(AuthTokenHelperService);
  private readonly router = inject(Router);
  private readonly notification = inject(AuthNotificationService);
  private readonly errorHandler = inject(ErrorHandler);

  /**
   * One session at a time, and it is the newest attempt that wins.
   *
   * Two paths reach this effect: the login form, where a second submit is a
   * double click and used to produce two navigations and two reloads, and the
   * dashboard user picker, where a second click is a deliberate switch to
   * another user. `'first'` would fix the double click by ignoring the switch,
   * which is the wrong answer for the picker, so the earlier attempt is
   * abandoned instead, and only the last one reaches the state.
   */
  public readonly loginRequestEffect = createEffect(
    loginActions.request,
    async (payload) => {
      try {
        const res = await firstValueFrom(this.authRepository.login(payload));

        if (!res.body) {
          return loginActions.failure();
        }

        this.authToken.setAccessToken(res.body.accessToken);

        return loginActions.success(res.body);
      } catch {
        return loginActions.failure();
      }
    },
    { concurrency: 'latest', mustAnswer: true },
  );

  /**
   * The two features are reloaded through their own handles, as the guide's
   * rule asks. The directory is not: it is auth's own list, so this returns
   * auth's own action and the cascade is visible as one.
   */
  public readonly loginSuccessEffect = createEffect(
    loginActions.success,
    (session) => {
      this.projectManager.getAll();
      this.taskManager.getAll();
      this.router.navigate(['/']);

      return getMembersActions.request(session.userId);
    },
  );

  public readonly loginFailureEffect = createEffect(
    loginActions.failure,
    () => {
      this.notification.loginFailure();
    },
  );

  public readonly authenticateRequestEffect = createEffect(
    authenticateActions.request,
    async () => {
      const accessToken = this.authToken.getAccessToken();

      if (accessToken) {
        const decoded = this.authTokenHelper.decode(accessToken);
        const now = Math.floor(Date.now() / 1000);

        if (!decoded || decoded.exp < now) {
          return authenticateActions.failure();
        }

        return authenticateActions.success(
          this.authTokenHelper.getPayload(decoded),
        );
      }

      try {
        const res = await firstValueFrom(this.authRepository.authenticate());
        const newToken = this.authToken.setNewAccessTokenFromResponse(res);
        const decoded = this.authTokenHelper.decode(newToken);

        return decoded
          ? authenticateActions.success(
              this.authTokenHelper.getPayload(decoded),
            )
          : authenticateActions.failure();
      } catch (error) {
        this.errorHandler.handleError(error);
        return authenticateActions.failure();
      }
    },
    /**
     * One renewal at a time. Now that the access-token interceptor is reached,
     * several requests failing with 401 together would each ask for a refresh,
     * and each successful one reloads the tasks and the projects.
     */
    { concurrency: 'first', mustAnswer: true },
  );

  public readonly authenticateFailureEffect = createEffect(
    authenticateActions.failure,
    () => {
      if (this.router.url !== '/') {
        this.notification.AuthenticateFailure();
      }

      // An access token we could not renew is a session that is over, so it
      // is cleared properly. Without one this is a visitor who never had a
      // session, and there is nothing to undo.
      if (!this.authToken.getAccessToken()) {
        return;
      }

      return logoutActions.request();
    },
  );

  public readonly authenticateSuccessEffect = createEffect(
    authenticateActions.success,
    (user) => {
      this.projectManager.getAll();
      this.taskManager.getAll();

      return getMembersActions.request(user.userId);
    },
  );

  /**
   * `'latest'` and keyed by nobody: there is one organisation to read at a
   * time, and a cold start that both renews a token and signs in asks twice
   * for the same list. A failure is reported but says nothing on screen, and
   * the panel falls back to ids.
   */
  public readonly getMembersRequestEffect = createEffect(
    getMembersActions.request,
    async (userId) => {
      try {
        return getMembersActions.success(
          await firstValueFrom(this.authRepository.members(userId)),
        );
      } catch (error) {
        this.errorHandler.handleError(error);

        return getMembersActions.failure();
      }
    },
    { concurrency: 'latest', mustAnswer: true },
  );

  public readonly logoutRequestEffect = createEffect(
    logoutActions.request,
    async () => {
      try {
        await firstValueFrom(this.authRepository.logout());

        await Promise.all([
          this.taskManager.reset(),
          this.projectManager.reset(),
        ]);

        return logoutActions.success();
      } catch (error) {
        this.errorHandler.handleError(error);
        return logoutActions.failure();
      }
    },
    { mustAnswer: true },
  );

  public readonly logoutSuccessEffect = createEffect(
    logoutActions.success,
    () => {
      this.authToken.clearAccessToken();

      this.router.navigate(['/']);
    },
  );

  public readonly logoutFailureEffect = createEffect(
    logoutActions.failure,
    () => {
      this.notification.logoutFailure();
    },
  );
}
