import { InjectionToken } from "@angular/core";
import { IAuthManager } from "./auth-manager.interface";

export const AUTH_MANAGER = new InjectionToken<IAuthManager>('AUTH_MANAGER');
