import { TestBed } from '@angular/core/testing';
import { sampleUser } from '@testing/fake-managers';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import type { LoginResponses } from '../../models';
import { loginActions, logoutActions } from './auth.action';
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
  });
});
