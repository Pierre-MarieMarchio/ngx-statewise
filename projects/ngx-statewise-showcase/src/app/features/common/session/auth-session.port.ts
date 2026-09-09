import { Signal } from '@angular/core';
import { SessionUser } from './session-user.model';

/**
 * Who is signed in, for a feature that is not auth.
 *
 * One member, because one member is all anyone outside auth reads. Whoever
 * implements it may expose far more; nothing here has to know that.
 */
export interface IAuthSession {
  readonly user: Signal<SessionUser | null>;
}
