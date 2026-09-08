import { TestBed } from '@angular/core/testing';
import {
  AUTH_MANAGER,
  PROJECT_MANAGER,
  TASK_MANAGER,
} from '@shared/app-common/tokens';
import {
  fakeAuthManager,
  FakeAuthManager,
  fakeProjectManager,
  fakeTaskManager,
} from '@testing/fake-managers';
import { UserSwitchService } from './user-switch.service';

const CREDENTIALS = { email: 'user1@user', password: 'user1' };

interface Gate {
  readonly promise: Promise<void>;
  readonly answer: () => void;
}

function gate(): Gate {
  let answer!: () => void;
  const promise = new Promise<void>((resolve) => {
    answer = () => {
      resolve();
    };
  });

  return { promise, answer };
}

describe('UserSwitchService', () => {
  let authManager: FakeAuthManager;
  let taskReload: Gate;
  let projectReload: Gate;
  let userSwitch: UserSwitchService;

  beforeEach(() => {
    authManager = fakeAuthManager();
    taskReload = gate();
    projectReload = gate();

    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_MANAGER, useValue: authManager },
        {
          provide: TASK_MANAGER,
          useValue: {
            ...fakeTaskManager(),
            reloaded: () => taskReload.promise,
          },
        },
        {
          provide: PROJECT_MANAGER,
          useValue: {
            ...fakeProjectManager(),
            settled: () => projectReload.promise,
          },
        },
      ],
    });

    userSwitch = TestBed.inject(UserSwitchService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('signs in as the user it was given', async () => {
    taskReload.answer();
    projectReload.answer();

    await userSwitch.switchTo(CREDENTIALS);

    expect(authManager.logins).toEqual([CREDENTIALS]);
  });

  /**
   * The reason this service exists. The login cascade reloads both features
   * through their own handles, and observation is scoped like dispatch, so the
   * login settles while the reloads are still in flight.
   */
  it('keeps switching after the login has settled', async () => {
    const switching = userSwitch.switchTo(CREDENTIALS);
    await Promise.resolve();

    expect(authManager.logins.length).toBe(1);
    expect(userSwitch.isSwitching()).toBe(true);

    taskReload.answer();
    projectReload.answer();
    await switching;

    expect(userSwitch.isSwitching()).toBe(false);
  });

  it('waits for the slower of the two features', async () => {
    const switching = userSwitch.switchTo(CREDENTIALS);

    taskReload.answer();
    await Promise.resolve();

    expect(userSwitch.isSwitching()).toBe(true);

    projectReload.answer();
    await switching;

    expect(userSwitch.isSwitching()).toBe(false);
  });

  it('lets go even when signing in fails', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AUTH_MANAGER,
          useValue: {
            ...fakeAuthManager(),
            login: () => Promise.reject(new Error('refused')),
          },
        },
        { provide: TASK_MANAGER, useValue: fakeTaskManager() },
        { provide: PROJECT_MANAGER, useValue: fakeProjectManager() },
      ],
    });
    const failing = TestBed.inject(UserSwitchService);

    await expect(failing.switchTo(CREDENTIALS)).rejects.toThrow('refused');
    expect(failing.isSwitching()).toBe(false);
  });
});
