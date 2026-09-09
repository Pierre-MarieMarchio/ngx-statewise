import { InjectionToken } from '@angular/core';
import { IAuthSession } from './auth-session.port';

export const AUTH_SESSION = new InjectionToken<IAuthSession>('AUTH_SESSION');
