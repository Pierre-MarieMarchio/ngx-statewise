import { InjectionToken } from '@angular/core';
import { ITaskReload } from './task-reload.port';

export const TASK_RELOAD = new InjectionToken<ITaskReload>('TASK_RELOAD');
