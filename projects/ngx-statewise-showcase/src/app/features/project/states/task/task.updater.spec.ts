import { TestBed } from '@angular/core/testing';
import { Task } from '../../models';
import { sampleTask } from '@testing/fake-managers';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import {
  createTaskActions,
  deleteTaskActions,
  getAllTaskActions,
  searchTaskActions,
  taskReset,
  updateTaskActions,
} from './task.action';
import { TaskState } from './task.state';
import { taskUpdater } from './task.updater';

const TODO = sampleTask({ id: 'a', status: 'todo' });
const OTHER = sampleTask({ id: 'b', status: 'todo' });

const moved = (task: Task, status: Task['status']): Task => ({
  ...task,
  status,
});

const REFUSED = 'assign someone to this task before marking it done';

/** A refusal for one card, carrying what the server said about it. */
const refusing = (taskId: string) =>
  updateTaskActions.failure({ taskId, reason: REFUSED });

/**
 * No effects are registered, so a dispatch runs the updater and nothing else.
 * What is under test is the state machine, not the repository behind it.
 */
describe('taskUpdater', () => {
  let statewise: Statewise;
  let state: TaskState;

  const statusOf = (taskId: string): string | undefined =>
    state.tasks().find((task) => task.id === taskId)?.status;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting()],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(taskUpdater),
    );
    state = TestBed.inject(TaskState);

    statewise.dispatch(getAllTaskActions.success([TODO, OTHER]));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('moves the card before the server has answered', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));

    expect(statusOf('a')).toBe('done');
  });

  it('keeps what the server answers rather than what was asked', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));
    statewise.dispatch(updateTaskActions.success(moved(TODO, 'in-progress')));

    expect(statusOf('a')).toBe('in-progress');
  });

  it('puts the card back when its write fails', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));
    statewise.dispatch(refusing('a'));

    expect(statusOf('a')).toBe('todo');
    expect(state.saveError()).toBe(REFUSED);
  });

  /**
   * `isError` belongs to reading the list, like `isLoading` beside it. A
   * refused write used to light that banner, which reads "the tasks could not
   * be loaded" and offers a "Try again" that reloads everything — an answer to
   * a question nobody had asked.
   */
  it('says why it was refused without claiming the list failed', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));
    statewise.dispatch(refusing('a'));

    expect(state.isError()).toBe(false);
  });

  it('drops the reason once another write starts', () => {
    statewise.dispatch(refusing('a'));
    statewise.dispatch(updateTaskActions.request(moved(OTHER, 'done')));

    expect(state.saveError()).toBeNull();
  });

  /**
   * The bug this state machine exists for: `isError` was a single flag for
   * every write in flight, so one refusal reverted every card the user had
   * moved, including those the server had accepted or never seen.
   */
  it('leaves the other writes in flight where the user put them', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));
    statewise.dispatch(updateTaskActions.request(moved(OTHER, 'in-progress')));

    statewise.dispatch(refusing('a'));

    expect(statusOf('a')).toBe('todo');
    expect(statusOf('b')).toBe('in-progress');
  });

  it('has nothing left to put back once a write has succeeded', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));
    statewise.dispatch(updateTaskActions.success(moved(TODO, 'done')));

    statewise.dispatch(refusing('a'));

    expect(statusOf('a')).toBe('done');
  });

  it('forgets the writes in flight along with the tasks on a reset', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));

    statewise.dispatch(taskReset());
    statewise.dispatch(getAllTaskActions.success([TODO, OTHER]));
    statewise.dispatch(refusing('a'));

    // The reset dropped the point of return, so the refusal restores nothing.
    expect(statusOf('a')).toBe('todo');
  });
  describe('what the views read', () => {
    it('leaves isLoading to reading the list', () => {
      statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));

      expect(state.isLoading()).toBe(false);
    });

    it('keeps a write visible until it answers', () => {
      statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));

      expect(state.pendingWrites().size).toBe(1);

      statewise.dispatch(updateTaskActions.success(moved(TODO, 'done')));

      expect(state.pendingWrites().size).toBe(0);
    });

    /**
     * The first answer used to clear a single flag, so the spinner stopped
     * while the writes beside it were still going.
     */
    it('stays saving while one of two writes is still in flight', () => {
      statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));
      statewise.dispatch(updateTaskActions.request(moved(OTHER, 'done')));

      statewise.dispatch(updateTaskActions.success(moved(TODO, 'done')));

      expect(state.pendingWrites().size).toBe(1);
    });
  });

  describe('creating a task', () => {
    const DRAFT = {
      projectId: 'project-1',
      title: 'Wire the form',
      status: 'todo',
      priority: 'low',
    } as const;

    it('is creating, and no longer refused, while it runs', () => {
      statewise.dispatch(createTaskActions.failure('a title is required'));

      statewise.dispatch(createTaskActions.request(DRAFT));

      expect(state.isCreating()).toBe(true);
      expect(state.createError()).toBeNull();
    });

    it('joins the list on success, without a reload', () => {
      statewise.dispatch(createTaskActions.request(DRAFT));
      statewise.dispatch(
        createTaskActions.success(sampleTask({ id: 'new', status: 'todo' })),
      );

      expect(state.tasks().map((task) => task.id)).toEqual(['a', 'b', 'new']);
      expect(state.isCreating()).toBe(false);
    });

    it('keeps the reason it was refused, so a form can repeat it', () => {
      statewise.dispatch(createTaskActions.request(DRAFT));
      statewise.dispatch(
        createTaskActions.failure('this project already has a task called "x"'),
      );

      expect(state.isCreating()).toBe(false);
      expect(state.createError()).toBe(
        'this project already has a task called "x"',
      );
    });

    /** A creation never enters pendingWrites: it is pessimistic, so there is
     * no optimistic card to put back. */
    it('leaves the writes in flight alone', () => {
      statewise.dispatch(createTaskActions.request(DRAFT));
      expect(state.pendingWrites().size).toBe(0);

      statewise.dispatch(createTaskActions.failure('refused'));
      expect(state.pendingWrites().size).toBe(0);
    });

    it('leaves nothing behind on a reset', () => {
      statewise.dispatch(createTaskActions.request(DRAFT));
      statewise.dispatch(createTaskActions.failure('refused'));

      statewise.dispatch(taskReset());

      expect(state.isCreating()).toBe(false);
      expect(state.createError()).toBeNull();
    });
  });

  describe('removing one', () => {
    it('takes it out of the list', () => {
      statewise.dispatch(deleteTaskActions.success('a'));

      expect(state.tasks().map((task) => task.id)).toEqual(['b']);
    });

    /**
     * And out of the matches too: a search that found it would go on showing a
     * row the server no longer has.
     */
    it('takes it out of what a search matched', () => {
      statewise.dispatch(searchTaskActions.success([TODO, OTHER]));

      statewise.dispatch(deleteTaskActions.success('a'));

      expect(state.matches()?.map((task) => task.id)).toEqual(['b']);
    });

    it('leaves the matches alone while there is no search', () => {
      statewise.dispatch(deleteTaskActions.success('a'));

      expect(state.matches()).toBeNull();
    });

    it('keeps the reason it was refused, and the row', () => {
      statewise.dispatch(deleteTaskActions.failure('no such task'));

      expect(state.saveError()).toBe('no such task');
      expect(state.tasks().map((task) => task.id)).toEqual(['a', 'b']);
    });
  });
});
