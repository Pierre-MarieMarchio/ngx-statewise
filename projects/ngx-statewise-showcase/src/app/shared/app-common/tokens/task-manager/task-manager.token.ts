import { InjectionToken } from "@angular/core";
import { ITaskManager } from "./task-manager.interface";

export const TASK_MANAGER = new InjectionToken<ITaskManager>('TASK_MANAGER');
