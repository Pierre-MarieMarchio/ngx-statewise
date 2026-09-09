import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { fakeAuthManager, FakeAuthManager } from '@testing/fake-managers';
import { AuthManager } from '../states';
import { loggedInGuard } from './logged-in.guard';
import { loggedOutGuard } from './logged-out.guard';

/**
 * The only access control in the showcase, and it had no test at all: letting
 * everyone through, or inverting either condition, failed nothing.
 *
 * Both guards read a signal and answer synchronously, so they are called
 * directly in an injection context rather than through a router navigation —
 * what is under test is the decision, not Angular's routing.
 */
describe('the route guards', () => {
  let authManager: FakeAuthManager;
  let navigations: string[][];

  /** Both guards read a signal and ignore the two snapshots entirely. */
  const decide = (guard: CanActivateFn): unknown =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

  beforeEach(() => {
    authManager = fakeAuthManager();
    navigations = [];

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthManager, useValue: authManager },
        {
          provide: Router,
          useValue: {
            navigate: (commands: string[]) => {
              navigations.push(commands);

              return Promise.resolve(true);
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('loggedInGuard, which keeps a signed-in visitor off the landing and login pages', () => {
    it('sends a signed-in visitor to the dashboard', () => {
      authManager.isLoggedIn.set(true);

      expect(decide(loggedInGuard)).toBe(false);
      expect(navigations).toEqual([['/home']]);
    });

    it('lets an anonymous visitor through, without redirecting', () => {
      authManager.isLoggedIn.set(false);

      expect(decide(loggedInGuard)).toBe(true);
      expect(navigations).toEqual([]);
    });
  });

  describe('loggedOutGuard, which protects the four signed-in routes', () => {
    it('sends an anonymous visitor back to the landing page', () => {
      authManager.isLoggedIn.set(false);

      expect(decide(loggedOutGuard)).toBe(false);
      expect(navigations).toEqual([['/']]);
    });

    it('lets a signed-in visitor through, without redirecting', () => {
      authManager.isLoggedIn.set(true);

      expect(decide(loggedOutGuard)).toBe(true);
      expect(navigations).toEqual([]);
    });
  });
});
