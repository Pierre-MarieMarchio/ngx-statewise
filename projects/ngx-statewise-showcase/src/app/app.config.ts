import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { routes } from './app.routes';
import { accessTokenInterceptor } from './features/auth/interceptors/access-token.interceptor';
import { provideEffects, provideStatewise } from 'ngx-statewise';
import { AuthEffects } from './features/auth/managers/auth-effects';
import { AuthManager } from './features/auth/managers/auth-manager';
import { AUTH_MANAGER } from '@shared/token-provider/auth-manager/auth-manager.token';


export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptors([accessTokenInterceptor])),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideStatewise(),
    provideEffects([AuthEffects]),

    { provide: AUTH_MANAGER, useExisting: AuthManager },
    
    provideAppInitializer(async () => {
      // const authManager = inject(AUTH_MANAGER);
      // await authManager.authenticate();
    }),
  ],
};
