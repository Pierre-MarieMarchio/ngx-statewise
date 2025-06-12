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
import { provideEffects, provideStatewise } from 'ngx-statewise';
import { fakeApiInterceptor } from './core/fake-api';
import { AuthEffect, AuthManager } from './features/auth/states';
import { TaskEffect, TaskManager } from './features/task/states';
import { ProjectEffect, ProjectManager } from './features/project/states';
import {
  AUTH_MANAGER,
  PROJECT_MANAGER,
  TASK_MANAGER,
} from '@shared/app-common/tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([fakeApiInterceptor, accessTokenInterceptor])
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStatewise(),
    provideEffects([AuthEffect, TaskEffect, ProjectEffect]),

    { provide: AUTH_MANAGER, useExisting: AuthManager },
    { provide: TASK_MANAGER, useExisting: TaskManager },
    { provide: PROJECT_MANAGER, useExisting: ProjectManager },

    provideAppInitializer(async () => {
      const authManager = inject(AUTH_MANAGER);
      await authManager.authenticate();
    }),
  ],
};
