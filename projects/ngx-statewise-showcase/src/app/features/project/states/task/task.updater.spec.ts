import { TestBed } from '@angular/core/testing';
import { Task } from '../../models';
import { sampleTask } from '@testing/fake-managers';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { getAllTaskActions, taskReset, updateTaskActions } from './task.action';
import { TaskState } from './task.state';
import { taskUpdater } from './task.updater';

const TODO = sampleTask({ id: 'a', status: 'todo' });
const OTHER = sampleTask({ id: 'b', status: 'todo' });

const moved = (task: Task, status: Task['status']): Task => ({
  ...task,
  status,
});

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
    statewise.dispatch(updateTaskActions.failure('a'));

    expect(statusOf('a')).toBe('todo');
    expect(state.isError()).toBe(true);
  });

  /**
   * The bug this state machine exists for: `isError` was a single flag for
   * every write in flight, so one refusal reverted every card the user had
   * moved, including those the server had accepted or never seen.
   */
  it('leaves the other writes in flight where the user put them', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));
    statewise.dispatch(updateTaskActions.request(moved(OTHER, 'in-progress')));

    statewise.dispatch(updateTaskActions.failure('a'));

    expect(statusOf('a')).toBe('todo');
    expect(statusOf('b')).toBe('in-progress');
  });

  it('has nothing left to put back once a write has succeeded', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));
    statewise.dispatch(updateTaskActions.success(moved(TODO, 'done')));

    statewise.dispatch(updateTaskActions.failure('a'));

    expect(statusOf('a')).toBe('done');
  });

  it('forgets the writes in flight along with the tasks on a reset', () => {
    statewise.dispatch(updateTaskActions.request(moved(TODO, 'done')));

    statewise.dispatch(taskReset());
    statewise.dispatch(getAllTaskActions.success([TODO, OTHER]));
    statewise.dispatch(updateTaskActions.failure('a'));

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
});
