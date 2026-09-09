import { InjectionToken } from '@angular/core';
import { IProjectReload } from './project-reload.port';

export const PROJECT_RELOAD = new InjectionToken<IProjectReload>(
  'PROJECT_RELOAD',
);
