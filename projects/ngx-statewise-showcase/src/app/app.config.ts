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
import { AuthEffect } from './features/auth/states/auth/auth.effect';
import { AuthManager } from './features/auth/states/auth/auth.manager';
import { AUTH_MANAGER } from '@shared/app-common/tokens/auth-manager/auth-manager.token';
import { fakeApiInterceptor } from './core/fake-api';
import { TASK_MANAGER } from '@shared/app-common/tokens/task-manager/task-manager.token';
import { TaskEffect, TaskManager } from './features/task/states';


export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([fakeApiInterceptor, accessTokenInterceptor])
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    provideStatewise(),
    provideEffects([AuthEffect, TaskEffect]),

    { provide: AUTH_MANAGER, useExisting: AuthManager },
    { provide: TASK_MANAGER, useExisting: TaskManager },

    provideAppInitializer(async () => {
      const authManager = inject(AUTH_MANAGER);
      await authManager.authenticate();
    }),
  ],
};
