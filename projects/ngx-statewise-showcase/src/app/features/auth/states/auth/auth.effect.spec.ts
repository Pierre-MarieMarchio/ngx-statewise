import { ErrorHandler } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  fakeProjectReload,
  fakeTaskReload,
  sampleUser,
} from '@testing/fake-managers';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { Observable, Subject, throwError } from 'rxjs';
import type { AuthenticateResponses, LoginResponses, User } from '../../models';
import {
  AuthNotificationService,
  AuthRepositoryService,
  AuthTokenService,
} from '../../services';
import {
  authenticateActions,
  loginActions,
  logoutActions,
} from './auth.action';
import { AuthEffect } from './auth.effect';
import { AuthState } from './auth.state';
import { authUpdater } from './auth.updater';
import { PROJECT_RELOAD, TASK_RELOAD } from '@app/features/common';
import { at } from '@testing/at';

const CLAIMS = {
  nameidentifier:
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
} as const;

const base64url = (value: unknown): string =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** A structurally real JWT, so the effect's own decoding is exercised. */
function accessTokenExpiring(exp: number): string {
  return `${base64url({ typ: 'JWT', alg: 'HS256' })}.${base64url({
    [CLAIMS.nameidentifier]: 'user-1',
    [CLAIMS.name]: 'admin',
    [CLAIMS.email]: 'admin@admin',
    [CLAIMS.role]: 'admin',
    organizationId: 'org-1',
    exp,
  })}.signature`;
}

const IN_THE_FUTURE = accessTokenExpiring(9_747_996_611);
const ALREADY_EXPIRED = accessTokenExpiring(1);

const LOGGED_IN: LoginResponses = {
  userId: 'user-1',
  userName: 'admin',
  email: 'admin@admin',
  role: 'admin',
  organizationId: 'org-1',
  accessToken: IN_THE_FUTURE,
  expirationTime: 3600,
};

const CREDENTIALS = { email: 'admin@admin', password: 'admin' };

const answering = <Value>(value: Value): Observable<Value> =>
  new Observable((subscriber) => {
    subscriber.next(value);
    subscriber.complete();
  });

describe('AuthEffect', () => {
  let statewise: Statewise;
  let state: AuthState;
  let tokens: AuthTokenService;
  let reported: unknown[];
  let navigations: unknown[];
  let notices: string[];
  let taskReloads: number;
  let projectReloads: number;
  let resets: string[];
  let routerUrl: string;

  let members: () => Observable<User[]>;

  let login: () => Observable<HttpResponse<LoginResponses>>;
  let authenticate: () => Observable<HttpResponse<AuthenticateResponses>>;
  let logout: () => Observable<HttpResponse<void>>;

  const setUp = (): void => {
    reported = [];
    navigations = [];
    notices = [];
    resets = [];
    taskReloads = 0;
    projectReloads = 0;
    routerUrl = '/home';

    TestBed.configureTestingModule({
      providers: [
        provideStatewiseTesting({ effects: [AuthEffect] }),
        {
          provide: ErrorHandler,
          useValue: { handleError: (error: unknown) => reported.push(error) },
        },
        {
          provide: Router,
          useValue: {
            get url() {
              return routerUrl;
            },
            navigate: (commands: unknown) => {
              navigations.push(commands);

              return Promise.resolve(true);
            },
          },
        },
        {
          provide: AuthRepositoryService,
          useValue: {
            login: () => login(),
            authenticate: () => authenticate(),
            logout: () => logout(),
            members: () => members(),
          },
        },
        {
          provide: AuthNotificationService,
          useValue: {
            loginFailure: () => notices.push('loginFailure'),
            AuthenticateFailure: () => notices.push('authenticateFailure'),
            logoutFailure: () => notices.push('logoutFailure'),
          },
        },
        {
          provide: TASK_RELOAD,
          useValue: {
            ...fakeTaskReload(),
            getAll: () => {
              taskReloads += 1;
            },
            reset: () => {
              resets.push('task');

              return Promise.resolve();
            },
          },
        },
        {
          provide: PROJECT_RELOAD,
          useValue: {
            ...fakeProjectReload(),
            getAll: () => {
              projectReloads += 1;
            },
            reset: () => {
              resets.push('project');

              return Promise.resolve();
            },
          },
        },
      ],
    });

    state = TestBed.inject(AuthState);
    tokens = TestBed.inject(AuthTokenService);
    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(authUpdater),
    );
  };

  beforeEach(() => {
    localStorage.clear();
    members = () => answering([sampleUser()]);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  describe('logging in', () => {
    it('stores the access token and opens the session', async () => {
      login = () => answering(new HttpResponse({ body: LOGGED_IN }));
      setUp();

      await statewise.dispatchAsync(loginActions.request(CREDENTIALS));

      expect(tokens.getAccessToken()).toBe(IN_THE_FUTURE);
      expect(state.isLoggedIn()).toBe(true);
      expect(state.user()?.userName).toBe('admin');
    });

    it('fails on a response carrying no credentials', async () => {
      login = () => answering(new HttpResponse<LoginResponses>({ body: null }));
      setUp();

      await statewise.dispatchAsync(loginActions.request(CREDENTIALS));

      expect(state.isLoggedIn()).toBe(false);
      expect(state.isError()).toBe(true);
      expect(tokens.getAccessToken()).toBeNull();
    });

    it('fails when the call itself fails, and says so', async () => {
      login = () => throwError(() => new Error('refused'));
      setUp();

      await statewise.dispatchAsync(loginActions.request(CREDENTIALS));

      expect(state.isError()).toBe(true);
      expect(notices).toEqual(['loginFailure']);
    });

    /**
     * The cascade the guide's rule is about: the effect calls each manager
     * rather than returning another feature's action.
     */
    it('reloads both features and lands on the home page', async () => {
      login = () => answering(new HttpResponse({ body: LOGGED_IN }));
      setUp();

      await statewise.dispatchAsync(loginActions.request(CREDENTIALS));

      expect(taskReloads).toBe(1);
      expect(projectReloads).toBe(1);
      expect(navigations).toEqual([['/']]);
    });

    /**
     * The directory is auth's own list, so the effect returns auth's own
     * action and the cascade is one chain rather than an imperative call.
     */
    it('goes on to read who else is in the organisation', async () => {
      login = () => answering(new HttpResponse({ body: LOGGED_IN }));
      members = () =>
        answering([sampleUser(), sampleUser({ userId: 'user-2' })]);
      setUp();

      await statewise.dispatchAsync(loginActions.request(CREDENTIALS));

      expect(state.members().map((member) => member.userId)).toEqual([
        'user-1',
        'user-2',
      ]);
    });

    it('lets the newest attempt supersede the one in flight', async () => {
      const gates: Subject<HttpResponse<LoginResponses>>[] = [];
      login = () => {
        const gate = new Subject<HttpResponse<LoginResponses>>();
        gates.push(gate);

        return gate;
      };
      setUp();

      const first = statewise.dispatchAsync(
        loginActions.request({ email: 'user1@user', password: 'user1' }),
      );
      const second = statewise.dispatchAsync(loginActions.request(CREDENTIALS));

      at(gates, 1).next(new HttpResponse({ body: LOGGED_IN }));
      at(gates, 1).complete();
      await second;
      at(gates, 0).next(
        new HttpResponse({ body: { ...LOGGED_IN, userName: 'user1' } }),
      );
      at(gates, 0).complete();
      await first;

      // The abandoned attempt answered last and was dropped.
      expect(state.user()?.userName).toBe('admin');
      expect(navigations).toEqual([['/']]);
    });
  });

  describe('resuming a session', () => {
    it('reads the stored access token without calling the API', async () => {
      authenticate = () => throwError(() => new Error('must not be called'));
      setUp();
      tokens.setAccessToken(IN_THE_FUTURE);

      await statewise.dispatchAsync(authenticateActions.request());

      expect(state.isLoggedIn()).toBe(true);
      expect(state.user()?.role).toBe('admin');
    });

    it('refuses an access token that has expired', async () => {
      authenticate = () => throwError(() => new Error('must not be called'));
      setUp();
      tokens.setAccessToken(ALREADY_EXPIRED);

      await statewise.dispatchAsync(authenticateActions.request());

      expect(state.isLoggedIn()).toBe(false);
    });

    /** Without a token the cookie decides, so the API is the only way to ask. */
    it('asks the API when it has no access token at all', async () => {
      authenticate = () =>
        answering(
          new HttpResponse({
            body: { success: true, accessToken: IN_THE_FUTURE },
          }),
        );
      setUp();

      await statewise.dispatchAsync(authenticateActions.request());

      expect(state.isLoggedIn()).toBe(true);
      expect(tokens.getAccessToken()).toBe(IN_THE_FUTURE);
    });

    it('reports a failed renewal and stays anonymous', async () => {
      const failure = new Error('no cookie');
      authenticate = () => throwError(() => failure);
      setUp();

      await statewise.dispatchAsync(authenticateActions.request());

      expect(state.isLoggedIn()).toBe(false);
      expect(reported).toEqual([failure]);
    });

    it('reloads both features once the session is back', async () => {
      authenticate = () => throwError(() => new Error('must not be called'));
      setUp();
      tokens.setAccessToken(IN_THE_FUTURE);

      await statewise.dispatchAsync(authenticateActions.request());

      expect(taskReloads).toBe(1);
      expect(projectReloads).toBe(1);
    });

    /** One renewal at a time: several 401s together must not each ask. */
    it('runs a single renewal at a time', async () => {
      let calls = 0;
      const gate = new Subject<HttpResponse<AuthenticateResponses>>();
      authenticate = () => {
        calls += 1;

        return gate;
      };
      setUp();

      const first = statewise.dispatchAsync(authenticateActions.request());
      const second = statewise.dispatchAsync(authenticateActions.request());

      gate.next(
        new HttpResponse({
          body: { success: true, accessToken: IN_THE_FUTURE },
        }),
      );
      gate.complete();
      await Promise.all([first, second]);

      expect(calls).toBe(1);
    });
  });

  describe('a renewal that failed', () => {
    it('logs out properly when there was a token to clear', async () => {
      authenticate = () => throwError(() => new Error('no cookie'));
      logout = () => answering(new HttpResponse<void>({ body: null }));
      setUp();
      tokens.setAccessToken(ALREADY_EXPIRED);

      await statewise.dispatchAsync(authenticateActions.request());

      expect(resets).toEqual(['task', 'project']);
      expect(tokens.getAccessToken()).toBeNull();
      expect(navigations).toEqual([['/']]);
    });

    it('does nothing to a visitor who never had a session', async () => {
      authenticate = () => throwError(() => new Error('no cookie'));
      logout = () => throwError(() => new Error('must not be called'));
      setUp();

      await statewise.dispatchAsync(authenticateActions.request());

      expect(resets).toEqual([]);
      expect(navigations).toEqual([]);
    });

    it('stays quiet about it on the landing page', async () => {
      authenticate = () => throwError(() => new Error('no cookie'));
      logout = () => throwError(() => new Error('must not be called'));
      setUp();
      routerUrl = '/';

      await statewise.dispatchAsync(authenticateActions.request());

      expect(notices).toEqual([]);
    });

    it('says so anywhere else', async () => {
      authenticate = () => throwError(() => new Error('no cookie'));
      logout = () => throwError(() => new Error('must not be called'));
      setUp();

      await statewise.dispatchAsync(authenticateActions.request());

      expect(notices).toEqual(['authenticateFailure']);
    });
  });

  describe('logging out', () => {
    it('empties both features, clears the token and goes home', async () => {
      logout = () => answering(new HttpResponse<void>({ body: null }));
      setUp();
      tokens.setAccessToken(IN_THE_FUTURE);

      await statewise.dispatchAsync(logoutActions.request());

      expect(resets).toEqual(['task', 'project']);
      expect(state.isLoggedIn()).toBe(false);
      expect(tokens.getAccessToken()).toBeNull();
      expect(navigations).toEqual([['/']]);
    });

    it('settles the state and says so when it is refused', async () => {
      const failure = new Error('refused');
      logout = () => throwError(() => failure);
      setUp();

      await statewise.dispatchAsync(logoutActions.request());

      // The handler the action group declared and nobody had written.
      expect(state.isLoading()).toBe(false);
      expect(state.isError()).toBe(true);
      expect(notices).toEqual(['logoutFailure']);
      expect(reported).toEqual([failure]);
    });
  });
});
