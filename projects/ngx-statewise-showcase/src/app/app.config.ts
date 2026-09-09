import {
  ApplicationConfig,
  ErrorHandler,
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
import { fakeBackendInterceptor } from './fake-backend';
import { ShowcaseErrorHandler } from './core/error-handling';
import {
  AuthEffect,
  AuthManager,
  withoutCredentials,
} from './features/auth/states';
import { TaskEffect, TaskManager } from './features/project/states';
import { ProjectEffect, ProjectManager } from './features/project/states';
import { noticeUpdater, TallyGuard } from './features/inspection/states';
import { AUTH_SESSION, PROJECT_RELOAD, TASK_RELOAD } from './features/common';
import { provideTeamDirectory } from './pages/team-directory.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      // The fake API answers without calling `next`, so it terminates the
      // chain and has to come last. The other way round, the access-token
      // interceptor was never reached at all.
      withInterceptors([accessTokenInterceptor, fakeBackendInterceptor]),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Everything the library reports — a misrouted dispatch, an effect that
    // promised an action and produced none, the cause behind a failure
    // action — becomes state the state page renders.
    { provide: ErrorHandler, useClass: ShowcaseErrorHandler },
    provideRouter(routes),
    provideStatewise({
      effects: [AuthEffect, TaskEffect, ProjectEffect],
      // A class holding nothing but interceptors, which is what this option
      // is for: listing it under `effects` would name it wrong.
      interceptors: [TallyGuard],
      updaters: [noticeUpdater],
      history: { limit: 50, redact: withoutCredentials },
    }),

    // The shared kernel's three ports, each answered by the manager that owns
    // the state behind it. `useExisting` so a feature reading a port and the
    // feature owning it are looking at one instance.
    { provide: AUTH_SESSION, useExisting: AuthManager },
    { provide: TASK_RELOAD, useExisting: TaskManager },
    { provide: PROJECT_RELOAD, useExisting: ProjectManager },

    // And the one port a feature declares for itself: `features/project` asks
    // who a task may be assigned to, and the composition answers it from auth.
    provideTeamDirectory(),

    provideAppInitializer(async () => {
      const authManager = inject(AuthManager);
      await authManager.authenticate();
    }),
  ],
};
