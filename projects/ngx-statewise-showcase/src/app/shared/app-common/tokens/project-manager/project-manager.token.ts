import { InjectionToken } from "@angular/core";
import { IProjectManager } from "./project-manager.interface";

export const PROJECT_MANAGER = new InjectionToken<IProjectManager>('PROJECT_MANAGER');
