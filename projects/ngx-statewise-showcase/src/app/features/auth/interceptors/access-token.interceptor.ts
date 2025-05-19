import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthTokenService } from '../services/auth-token.service';
import { catchError, EMPTY, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthManager } from '../managers/auth-manager';
import { jwtDecode } from 'jwt-decode';

export const accessTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authManager = inject(AuthManager);
  const tokenService = inject(AuthTokenService);
  const authService = inject(AuthService);
  const accessToken = tokenService.getAccessToken();

  if (accessToken) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    });
  }

  const handle401 = () => {
    return authService.refreshAccessToken().pipe(
      switchMap(() => {
        const newToken = tokenService.getAccessToken();
        const accessTokenDecoded = jwtDecode(newToken);
        console.log(accessTokenDecoded);

        if (!newToken) {
          // authManager.logout();
          return EMPTY;
        }

        const newReq = req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
        });

        return next(newReq);
      }),
      catchError((authError) => {
        // authManager.logout();
        return throwError(() => authError);
      })
    );
  };

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const ignoreAPIs = ['/Auth/'];

      if (ignoreAPIs.some((api) => req.url.includes(api))) {
        return throwError(() => err);
      }

      if (err.status === 401) {
        return handle401();
      }
      authManager.logout();
      return EMPTY;
    })
  );
};
