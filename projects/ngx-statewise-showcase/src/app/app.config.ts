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
import { accessTokenInterceptor } from './features/auth/interceptors';
import { provideStatewise } from 'ngx-statewise';
import { fakeApiInterceptor } from './core/fake-api';
import {
  AuthEffect,
  AuthManager,
  withoutCredentials,
} from './features/auth/states';
import { TaskEffect, TaskManager } from './features/project/states';
import { ProjectEffect, ProjectManager } from './features/project/states';
import { noticeUpdater } from './features/notice/states';
import {
  AUTH_MANAGER,
  PROJECT_MANAGER,
  TASK_MANAGER,
} from '@shared/app-common/tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      // The fake API answers without calling `next`, so it terminates the
      // chain and has to come last. The other way round, the access-token
      // interceptor was never reached at all.
      withInterceptors([accessTokenInterceptor, fakeApiInterceptor]),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStatewise({
      effects: [AuthEffect, TaskEffect, ProjectEffect],
      updaters: [noticeUpdater],
      history: { limit: 50, redact: withoutCredentials },
    }),

    { provide: AUTH_MANAGER, useExisting: AuthManager },
    { provide: TASK_MANAGER, useExisting: TaskManager },
    { provide: PROJECT_MANAGER, useExisting: ProjectManager },

    provideAppInitializer(async () => {
      const authManager = inject(AUTH_MANAGER);
      await authManager.authenticate();
    }),
  ],
};
