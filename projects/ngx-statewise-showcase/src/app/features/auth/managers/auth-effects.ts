import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  authenticateActions,
  loginActions,
  logoutAction,
} from './auth-actions';
import { Router } from '@angular/router';
import { createEffect } from 'ngx-statewise';
import {
  AuthRepositoryService,
  AuthTokenService,
  AuthTokenHelperService,
} from '../services';
import { MatDialog } from '@angular/material/dialog';
import { SignupSucessDialogComponent } from '../pages/signup-page/components/signup-sucess-dialog/signup-sucess-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private readonly authRepository = inject(AuthRepositoryService);
  private readonly authToken = inject(AuthTokenService);
  private readonly authTokenHelper = inject(AuthTokenHelperService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  public readonly loginRequestEffect = createEffect(
    loginActions.request,
    async (payload) => {
      try {
        const res = await firstValueFrom(this.authRepository.login(payload));
        this.authToken.setAccessToken(res.body?.accessToken!);
        return loginActions.success(res.body!);
      } catch {
        return loginActions.failure();
      }
    }
  );

  public readonly loginSuccessEffect = createEffect(
    loginActions.success,
    () => {
      this.dialog.open(SignupSucessDialogComponent);
      this.router.navigate(['/']);
    }
  );

  public readonly authenticateRequestEffect = createEffect(
    authenticateActions.request,
    async () => {
      const accessToken = this.authToken.getAccessToken();

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
      this.router.navigate(['/']);
    }
  );

  public readonly logoutEffect = createEffect(logoutAction.action, () => {
    this.router.navigate(['/']);
  });
}
