import { TestBed } from '@angular/core/testing';
import { sampleUser } from '@testing/fake-managers';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import type { LoginResponses } from '../../models';
import { getMembersActions, loginActions, logoutActions } from './auth.action';
import { AuthState } from './auth.state';
import { authUpdater } from './auth.updater';

const CREDENTIALS = { email: 'admin@admin', password: 'admin' };

const LOGGED_IN: LoginResponses = {
  ...sampleUser(),
  accessToken: 'access-token',
  expirationTime: 9_747_996_611,
};

/** No effects are registered, so a dispatch runs the updater and nothing else. */
describe('authUpdater', () => {
  let statewise: Statewise;
  let state: AuthState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting()],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(authUpdater),
    );
    state = TestBed.inject(AuthState);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('login', () => {
    it('is loading, and no longer in error, while it runs', () => {
      state.isError.set(true);

      statewise.dispatch(loginActions.request(CREDENTIALS));

      expect(state.isLoading()).toBe(true);
      expect(state.isError()).toBe(false);
    });

    /**
     * Nothing asserted this, and the login page reads it: dropping the
     * `isLoading.set(false)` here left the form spinning for good after a
     * successful sign-in.
     */
    it('stops loading and opens the session when it succeeds', () => {
      statewise.dispatch(loginActions.request(CREDENTIALS));

      statewise.dispatch(loginActions.success(LOGGED_IN));

      expect(state.isLoading()).toBe(false);
      expect(state.isLoggedIn()).toBe(true);
      expect(state.isError()).toBe(false);
      expect(state.user()?.userId).toBe(LOGGED_IN.userId);
    });

    it('reports a refusal so a view can show it', () => {
      statewise.dispatch(loginActions.request(CREDENTIALS));
      statewise.dispatch(loginActions.failure());

      expect(state.isLoading()).toBe(false);
      expect(state.isError()).toBe(true);
      expect(state.isLoggedIn()).toBe(false);
    });
  });

  describe('logout', () => {
    /**
     * The action group declared this event and nothing handled it, so a failed
     * logout used to leave `isLoading` at true for good.
     */
    it('settles the state when it fails', () => {
      statewise.dispatch(logoutActions.request());
      statewise.dispatch(logoutActions.failure());

      expect(state.isLoading()).toBe(false);
      expect(state.isError()).toBe(true);
    });

    it('keeps the session a refused logout did not end', () => {
      statewise.dispatch(loginActions.success(LOGGED_IN));
      statewise.dispatch(logoutActions.request());
      statewise.dispatch(logoutActions.failure());

      expect(state.isLoggedIn()).toBe(true);
      expect(state.user()).not.toBeNull();
    });

    it('clears the session when it succeeds', () => {
      statewise.dispatch(loginActions.success(LOGGED_IN));
      statewise.dispatch(logoutActions.request());
      statewise.dispatch(logoutActions.success());

      expect(state.isLoggedIn()).toBe(false);
      expect(state.user()).toBeNull();
      expect(state.isLoading()).toBe(false);
    });

    /** The next session may be in another organisation. */
    it('forgets the organisation members too', () => {
      statewise.dispatch(getMembersActions.success([sampleUser()]));
      statewise.dispatch(logoutActions.request());
      statewise.dispatch(logoutActions.success());

      expect(state.members()).toEqual([]);
    });
  });

  describe('the organisation members', () => {
    it('holds what the server answered', () => {
      statewise.dispatch(
        getMembersActions.success([
          sampleUser(),
          sampleUser({ userId: 'user-2', userName: 'user1' }),
        ]),
      );

      expect(state.members().map((member) => member.userName)).toEqual([
        'admin',
        'user1',
      ]);
    });

    /**
     * Emptied rather than kept: names nothing can confirm any more would go on
     * being shown as though the directory were current, and an id is honest.
     * Neither flag of the session moves — a directory that failed to arrive is
     * not a session in error.
     */
    it('is emptied when the read fails, and says nothing else', () => {
      statewise.dispatch(loginActions.success(LOGGED_IN));
      statewise.dispatch(getMembersActions.success([sampleUser()]));
      statewise.dispatch(getMembersActions.failure());

      expect(state.members()).toEqual([]);
      expect(state.isError()).toBe(false);
      expect(state.isLoggedIn()).toBe(true);
    });
  });
});
