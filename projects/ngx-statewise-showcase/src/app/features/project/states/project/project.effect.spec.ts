import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, throwError } from 'rxjs';
import {
  injectStatewise,
  provideStatewise,
  type Statewise,
} from 'ngx-statewise';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import { fakeAuthManager, FakeAuthManager } from '@testing/fake-managers';
import { Project } from '../../models';
import { ProjectRepositoryService } from '../../services';
import { getAllProjectsActions } from './project.action';
import { ProjectEffect } from './project.effect';
import { ProjectState } from './project.state';
import { projectUpdater } from './project.updater';

const PROJECTS: Project[] = [
  { id: 'project-1', title: 'Analytics Dashboard', color: 'orange' },
];

describe('ProjectEffect', () => {
  let authManager: FakeAuthManager;
  let projectState: ProjectState;
  let statewise: Statewise;
  let source: Observable<Project[]>;
  let subscriptions: number;

  const setUp = (): void => {
    authManager = fakeAuthManager();
    subscriptions = 0;

    TestBed.configureTestingModule({
      providers: [
        provideStatewise({ effects: [ProjectEffect] }),
        { provide: AUTH_MANAGER, useValue: authManager },
        {
          provide: ProjectRepositoryService,
          useValue: {
            getAll: () =>
              new Observable<Project[]>((subscriber) => {
                subscriptions += 1;

                return source.subscribe(subscriber);
              }),
          },
        },
      ],
    });

    projectState = TestBed.inject(ProjectState);
    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(projectUpdater),
    );
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('fills the state from the Observable the repository returns', async () => {
    source = new Observable<Project[]>((subscriber) => {
      subscriber.next(PROJECTS);
      subscriber.complete();
    });
    setUp();

    await statewise.dispatchAsync(getAllProjectsActions.request());

    expect(projectState.projects()).toEqual(PROJECTS);
    expect(projectState.isLoading()).toBe(false);
    expect(projectState.isError()).toBe(false);
  });

  /**
   * The engine reads a one-shot source, so an emission arriving a tick later
   * must still be awaited by `dispatchAsync` rather than missed.
   */
  it('waits for an emission that does not arrive synchronously', async () => {
    source = new Observable<Project[]>((subscriber) => {
      setTimeout(() => {
        subscriber.next(PROJECTS);
        subscriber.complete();
      });
    });
    setUp();

    await statewise.dispatchAsync(getAllProjectsActions.request());

    expect(projectState.projects()).toEqual(PROJECTS);
  });

  it('marks the state failed when the source errors', async () => {
    source = throwError(() => new Error('unreachable'));
    setUp();

    await statewise.dispatchAsync(getAllProjectsActions.request());

    expect(projectState.isError()).toBe(true);
    expect(projectState.projects()).toBeNull();
  });

  /**
   * An empty source resolves to no action at all, so nothing settles the
   * request: the state stays loading rather than being reported as failed.
   */
  it('leaves the request unanswered when the source completes empty', async () => {
    source = EMPTY;
    setUp();

    await statewise.dispatchAsync(getAllProjectsActions.request());

    expect(projectState.projects()).toBeNull();
    expect(projectState.isError()).toBe(false);
    expect(projectState.isLoading()).toBe(true);
  });

  it('fails the request without calling the repository while no user is known', async () => {
    source = throwError(() => new Error('must not be subscribed'));
    setUp();
    authManager.user.set(null);

    await statewise.dispatchAsync(getAllProjectsActions.request());

    expect(subscriptions).toBe(0);
    expect(projectState.isError()).toBe(true);
  });

  it('subscribes the repository exactly once for one request', async () => {
    source = new Observable<Project[]>((subscriber) => {
      subscriber.next(PROJECTS);
      subscriber.complete();
    });
    setUp();

    await statewise.dispatchAsync(getAllProjectsActions.request());

    expect(subscriptions).toBe(1);
  });
});
