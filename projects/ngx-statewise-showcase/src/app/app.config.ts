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
import { TaskEffect } from './feature/project-management/states/task/task.effect';
import { TASK_MANAGER } from '@shared/app-common/tokens/task-manager/task-manager.token';
import { TaskManager } from './feature/project-management/states';

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
