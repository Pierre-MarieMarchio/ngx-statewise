import { ofType, type Action } from 'ngx-statewise';
import type { LoginSubmit } from '../../models';
import { loginActions } from './auth.action';

/**
 * Strips the password a login request carries, so the history keeps an entry
 * worth reading without keeping the credentials.
 *
 * The knowledge of what an action carries belongs to the feature declaring it,
 * even though the hook itself is wired once, application-wide, in
 * `provideStatewise`.
 */
export function withoutCredentials(action: Action): Action {
  if (action.type !== ofType(loginActions.request)) {
    return action;
  }

  const { email } = action.payload as LoginSubmit;

  return { type: action.type, payload: { email, password: '[redacted]' } };
}
