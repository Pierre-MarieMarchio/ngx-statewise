import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Task } from '../../models';
import {
  fakeAuthSession,
  FakeAuthSession,
  sampleTask,
} from '@testing/fake-managers';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { Observable, Subject, throwError } from 'rxjs';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { TaskRepositoryService } from '../../services';
import { getAllTaskActions, taskReset, updateTaskActions } from './task.action';
import { TaskEffect } from './task.effect';
import { TaskState } from './task.state';
import { taskUpdater } from './task.updater';
import { AUTH_SESSION } from '@app/features/common';

const TODO = sampleTask({ id: 'a', status: 'todo' });
const OTHER = sampleTask({ id: 'b', status: 'todo' });

const moved = (task: Task, status: Task['status']): Task => ({
  ...task,
  status,
});

interface Deferred<Value> {
  readonly source: Subject<Value>;
  readonly answer: (value: Value) => void;
}

function deferred<Value>(): Deferred<Value> {
  const source = new Subject<Value>();

  return {
    source,
    answer: (value) => {
      source.next(value);
      source.complete();
    },
  };
}

describe('TaskEffect', () => {
  let authManager: FakeAuthSession;
  let statewise: Statewise;
  let state: TaskState;
  let reported: unknown[];
  let getAllAnswers: () => Observable<Task[]>;
  let updateAnswers: (task: Partial<Task>) => Observable<Task>;
  let updateCalls: Partial<Task>[];

  const statusOf = (taskId: string): string | undefined =>
    state.tasks().find((task) => task.id === taskId)?.status;

  const setUp = (): void => {
    authManager = fakeAuthSession();
    reported = [];
    updateCalls = [];

    TestBed.configureTestingModule({
      providers: [
        provideStatewiseTesting({ effects: [TaskEffect] }),
        { provide: AUTH_SESSION, useValue: authManager },
        {
          provide: ErrorHandler,
          useValue: { handleError: (error: unknown) => reported.push(error) },
        },
        {
          provide: TaskRepositoryService,
          useValue: {
            getAll: () => getAllAnswers(),
            update: (_id: string, task: Partial<Task>) => {
              updateCalls.push(task);

              return updateAnswers(task);
            },
          },
        },
      ],
    });

    state = TestBed.inject(TaskState);
    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(taskUpdater),
    );
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('reading the list', () => {
    it('fills the state from the repository', async () => {
      getAllAnswers = () =>
        new Observable((s) => {
          s.next([TODO, OTHER]);
          s.complete();
        });
      setUp();

      await statewise.dispatchAsync(getAllTaskActions.request());

      expect(state.tasks()).toEqual([TODO, OTHER]);
      expect(state.isLoading()).toBe(false);
    });

    it('fails without asking, while no user is known', async () => {
      getAllAnswers = () => throwError(() => new Error('must not be called'));
      setUp();
      authManager.user.set(null);

      await statewise.dispatchAsync(getAllTaskActions.request());

      expect(state.isError()).toBe(true);
    });

    /**
     * A reset means there is no list left to fill. Without `cancelOn`, the
     * reload in flight answers after it and puts the whole list back, so the
     * reset is undone by a request that predates it.
     */
    it('abandons a reload in flight when the list is reset', async () => {
      const gate = deferred<Task[]>();
      getAllAnswers = () => gate.source;
      setUp();

      const abandoned = statewise.dispatchAsync(getAllTaskActions.request());

      await statewise.dispatchAsync(taskReset());
      gate.answer([TODO, OTHER]);
      await abandoned;

      expect(state.tasks()).toEqual([]);
    });

    it('reports the cause of a refusal and marks the state failed', async () => {
      const failure = new Error('unreachable');
      getAllAnswers = () => throwError(() => failure);
      setUp();

      await statewise.dispatchAsync(getAllTaskActions.request());

      expect(state.isError()).toBe(true);
      expect(reported).toEqual([failure]);
    });
  });

  describe('writing one task', () => {
    it('keeps what the server answers', async () => {
      getAllAnswers = () =>
        new Observable((s) => {
          s.next([TODO, OTHER]);
          s.complete();
        });
      updateAnswers = (task) =>
        new Observable((s) => {
          s.next(task as Task);
          s.complete();
        });
      setUp();
      await statewise.dispatchAsync(getAllTaskActions.request());

      await statewise.dispatchAsync(
        updateTaskActions.request(moved(TODO, 'done')),
      );

      expect(statusOf('a')).toBe('done');
      expect(updateCalls).toEqual([moved(TODO, 'done')]);
    });

    it('puts the card back and reports the cause when it fails', async () => {
      const failure = new Error('refused');
      getAllAnswers = () =>
        new Observable((s) => {
          s.next([TODO, OTHER]);
          s.complete();
        });
      updateAnswers = () => throwError(() => failure);
      setUp();
      await statewise.dispatchAsync(getAllTaskActions.request());

      await statewise.dispatchAsync(
        updateTaskActions.request(moved(TODO, 'done')),
      );

      expect(statusOf('a')).toBe('todo');
      // A plain `Error` carries no sentence, so the fallback travels.
      expect(state.saveError()).toBe('The server refused the request.');
      expect(state.isError()).toBe(false);
      expect(reported).toEqual([failure]);
    });

    it('fails the write of that one task while no user is known', async () => {
      getAllAnswers = () =>
        new Observable((s) => {
          s.next([TODO, OTHER]);
          s.complete();
        });
      updateAnswers = () => throwError(() => new Error('must not be called'));
      setUp();
      await statewise.dispatchAsync(getAllTaskActions.request());
      authManager.user.set(null);

      await statewise.dispatchAsync(
        updateTaskActions.request(moved(TODO, 'done')),
      );

      expect(updateCalls).toEqual([]);
      expect(statusOf('a')).toBe('todo');
    });
  });

  /** What the concurrency options on this effect are actually for. */
  describe('two writes at once', () => {
    const withList = async (): Promise<void> => {
      getAllAnswers = () =>
        new Observable((s) => {
          s.next([TODO, OTHER]);
          s.complete();
        });
      await statewise.dispatchAsync(getAllTaskActions.request());
    };

    it('lets the newest write of one card supersede the older one', async () => {
      const answers = new Map<string, Deferred<Task>>();
      updateAnswers = (task) => {
        const gate = deferred<Task>();
        answers.set(String(task.status), gate);

        return gate.source;
      };
      setUp();
      await withList();

      const slow = statewise.dispatchAsync(
        updateTaskActions.request(moved(TODO, 'in-progress')),
      );
      const fast = statewise.dispatchAsync(
        updateTaskActions.request(moved(TODO, 'done')),
      );

      answers.get('done')?.answer(moved(TODO, 'done'));
      await fast;
      answers.get('in-progress')?.answer(moved(TODO, 'in-progress'));
      await slow;

      // The stale answer was dropped, so the card holds the last intent.
      expect(statusOf('a')).toBe('done');
    });

    it('keeps two different cards from superseding each other', async () => {
      const answers = new Map<string, Deferred<Task>>();
      updateAnswers = (task) => {
        const gate = deferred<Task>();
        answers.set(String(task.id), gate);

        return gate.source;
      };
      setUp();
      await withList();

      const first = statewise.dispatchAsync(
        updateTaskActions.request(moved(TODO, 'done')),
      );
      const second = statewise.dispatchAsync(
        updateTaskActions.request(moved(OTHER, 'in-progress')),
      );

      answers.get('a')?.answer(moved(TODO, 'done'));
      answers.get('b')?.answer(moved(OTHER, 'in-progress'));
      await Promise.all([first, second]);

      expect(statusOf('a')).toBe('done');
      expect(statusOf('b')).toBe('in-progress');

      /*
       * The statuses alone prove nothing here: the updater moves the card on
       * `request`, so both read the same whether the first write was abandoned
       * or not. Its pending entry is what tells them apart — an abandoned run
       * answers nothing, so nothing ever closes it, and the board would report
       * itself saving for good.
       */
      expect(state.pendingWrites().size).toBe(0);
      expect(updateCalls.map((task) => task.id)).toEqual(['a', 'b']);
    });

    it('abandons a write in flight when the list is reset', async () => {
      const answers = new Map<string, Deferred<Task>>();
      updateAnswers = (task) => {
        const gate = deferred<Task>();
        answers.set(String(task.id), gate);

        return gate.source;
      };
      setUp();
      await withList();

      const abandoned = statewise.dispatchAsync(
        updateTaskActions.request(moved(TODO, 'done')),
      );

      await statewise.dispatchAsync(taskReset());
      answers.get('a')?.answer(moved(TODO, 'done'));
      await abandoned;

      // The reset emptied the list, and the answer never wrote to it.
      expect(state.tasks()).toEqual([]);
    });
  });
});
