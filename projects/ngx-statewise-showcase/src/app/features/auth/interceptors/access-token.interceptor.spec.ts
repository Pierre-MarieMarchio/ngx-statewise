import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { fakeBackendInterceptor } from '@app/fake-backend';
import { USERS } from '@app/fake-backend/db.data';
import { environment } from '../../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { AuthTokenService } from '../services';
import { AuthManager } from '../states/auth/auth.manager';
import { accessTokenInterceptor } from './access-token.interceptor';

const [ADMIN] = USERS;
const TASKS_URL = `${environment.API_BASE_URL}/Task`;

/** What the task endpoint needs beyond the bearer. */
const forAdmin = { params: { userId: ADMIN.id } };

/**
 * The whole chain, in order: the access-token interceptor puts the bearer on
 * the request, the fake API answers it. Both used to be registered the other
 * way round, which meant the first one was never reached at all.
 */
describe('accessTokenInterceptor', () => {
  let http: HttpClient;
  let tokens: AuthTokenService;
  let renewals: number;

  const setUp = (): void => {
    renewals = 0;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([accessTokenInterceptor, fakeBackendInterceptor]),
        ),
        {
          provide: AuthManager,
          useValue: {
            authenticate: () => {
              renewals += 1;
              // What the real renewal does: put a token the backend knows back
              // in storage, from the refresh cookie.
              TestBed.inject(AuthTokenService).setAccessToken(
                ADMIN.accessToken,
              );

              return Promise.resolve();
            },
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    tokens = TestBed.inject(AuthTokenService);
  };

  beforeEach(() => {
    localStorage.clear();
    setUp();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('answers a request carrying a token the backend knows', async () => {
    tokens.setAccessToken(ADMIN.accessToken);

    const tasks = await firstValueFrom(
      http.get<unknown[]>(TASKS_URL, forAdmin),
    );

    expect(Array.isArray(tasks)).toBe(true);
    expect(renewals).toBe(0);
  });

  /**
   * The branch that was unreachable: the fake API refused every request
   * without a bearer it knows, so the 401 recovery is a real path now.
   */
  it('renews the token on a 401 and replays the request', async () => {
    expect(tokens.getAccessToken()).toBeNull();

    const tasks = await firstValueFrom(
      http.get<unknown[]>(TASKS_URL, forAdmin),
    );

    expect(renewals).toBe(1);
    expect(Array.isArray(tasks)).toBe(true);
    expect(tokens.getAccessToken()).toBe(ADMIN.accessToken);
  });

  it('puts the bearer on the request it sends', async () => {
    tokens.setAccessToken('a-token-the-backend-does-not-know');

    // Unknown to the backend, so it answers 401 — which only happens if the
    // header reached it at all.
    await firstValueFrom(http.get<unknown[]>(TASKS_URL, forAdmin));

    expect(renewals).toBe(1);
  });

  it('reports a failure it cannot recover from', async () => {
    tokens.setAccessToken(ADMIN.accessToken);

    await expect(
      firstValueFrom(http.get(`${environment.API_BASE_URL}/Unknown`, forAdmin)),
    ).rejects.toBeDefined();
  });
});
