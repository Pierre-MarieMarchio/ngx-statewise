import { inject, Injectable } from '@angular/core';
import { AuthRepositoryService } from './auth-repository.service';
import { AuthStatesService } from './auth-states.service';
import { tap } from 'rxjs';
import { AuthTokenService } from './auth-token.service';
import { SignupSubmit } from '../interfaces/form-submits.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authRepository = inject(AuthRepositoryService);
  private readonly authStates = inject(AuthStatesService);
  private readonly authTokenService = inject(AuthTokenService);

  public getIsRegister() {
    return this.authStates.isRegister;
  }

  public register(data: SignupSubmit) {
    const result = this.authRepository
      .register({
        userName: data.email,
        email: data.email,
        password: data.password,
      })
      .pipe(
        tap({
          next: (res) => {
            const isSuccess = res.body?.email === data.email;
            this.authStates.isRegister.set(isSuccess);
          },
          error: () => {
            this.authStates.isRegister.set(false);
          },
        })
      );

    return result;
  }

  public refreshAccessToken() {
    return this.authRepository.authenticate().pipe(
      tap((res) => {
        if (res.body?.accessToken) {
          this.authTokenService.setAccessToken(res.body.accessToken);
        }
      })
    );
  }
}
