import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, EMPTY, from, switchMap, throwError } from 'rxjs';
import { AuthTokenService } from '../services';
import { AuthManager } from '../states';

export const accessTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authManager = inject(AuthManager);
  const tokenService = inject(AuthTokenService);
  const accessToken = tokenService.getAccessToken();

  if (accessToken) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const ignoreAPIs = ['/Auth/'];

      if (ignoreAPIs.some((api) => req.url.includes(api))) {
        return throwError(() => err);
      }

      if (err.status === 401) {
        return from(authManager.authenticate()).pipe(
          switchMap(() => {
            const newReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${tokenService.getAccessToken()}`,
              },
            });
            return next(newReq);
          })
        );
      }
      return EMPTY;
    })
  );
};
