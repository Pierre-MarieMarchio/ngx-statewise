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
import { accessTokenInterceptor } from './feature/auth/interceptors/access-token.interceptor';
import { provideEffects, provideStatewise } from 'ngx-statewise';
import { AuthEffect } from './feature/auth/states/auth/auth.effect';
import { AuthManager } from './feature/auth/states/auth/auth.manager';
import { AUTH_MANAGER } from '@shared/app-common/tokens/auth-manager/auth-manager.token';
import { fakeApiInterceptor } from './core/fake-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([fakeApiInterceptor, accessTokenInterceptor])
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideStatewise(),
    provideEffects([AuthEffect]),

    { provide: AUTH_MANAGER, useExisting: AuthManager },

    provideAppInitializer(async () => {
      const authManager = inject(AUTH_MANAGER);
      await authManager.authenticate();
    }),
  ],
};
