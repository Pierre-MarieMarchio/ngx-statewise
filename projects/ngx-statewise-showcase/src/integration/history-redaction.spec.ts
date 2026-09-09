import { TestBed } from '@angular/core/testing';
import { ActionHistory, ofType } from 'ngx-statewise';
import { appConfig } from '@app/app.config';
import { loginActions } from '@app/features/auth/states/auth/auth.action';
import { AuthManager } from '@app/features/auth/states';
import { at } from '@testing/at';

const CREDENTIALS = { email: 'admin@admin', password: 'admin' };

/**
 * The password must not reach the action history, and `withoutCredentials` is
 * only half of that promise. Its own spec proves the function redacts; nothing
 * proved it was wired. Removing `redact` from `provideStatewise` failed no test
 * at all, while the history is on with `limit: 50` and rendered as it is on
 * /history.
 *
 * So this signs in through the real `appConfig` — the whole provider set, the
 * fake backend included — and reads what the history actually kept.
 */
describe('the action history, as the application configures it', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('keeps a login request without its password', async () => {
    await TestBed.inject(AuthManager).login(CREDENTIALS);

    const recorded = TestBed.inject(ActionHistory)
      .snapshot()
      .filter((entry) => entry.action.type === ofType(loginActions.request));

    expect(recorded).toHaveLength(1);
    expect(at(recorded, 0).action.payload).toEqual({
      email: CREDENTIALS.email,
      password: '[redacted]',
    });
  });

  /**
   * The redaction replaces the action on its way into the history and must not
   * touch the one the updaters and effects receive — otherwise a signed-in
   * session would be impossible.
   */
  it('signs in all the same', async () => {
    const authManager = TestBed.inject(AuthManager);

    await authManager.login(CREDENTIALS);

    expect(authManager.isLoggedIn()).toBe(true);
  });
});
