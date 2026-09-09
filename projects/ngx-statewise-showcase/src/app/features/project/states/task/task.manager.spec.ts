import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { sampleTask } from '@testing/fake-managers';
import { TaskManager } from './task.manager';
import { TaskState } from './task.state';

describe('TaskManager', () => {
  let manager: TaskManager;
  let state: TaskState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewise({})],
    });

    state = TestBed.inject(TaskState);
    state.tasks.set([]);
    manager = TestBed.inject(TaskManager);
  });

  /**
   * Both pages read `isSaving` off the manager, and nothing observed it there:
   * the two updater specs assert on `pendingWrites` instead, so a manager that
   * always answered false would have kept every test green while both spinners
   * went dead.
   */
  describe('isSaving', () => {
    it('is false while nothing is in flight', () => {
      expect(manager.isSaving()).toBe(false);
    });

    it('is true while a write is in flight, and false once it answers', () => {
      const task = sampleTask({ id: 'a' });

      state.pendingWrites.set(new Map([['a', task]]));
      expect(manager.isSaving()).toBe(true);

      state.pendingWrites.set(new Map());
      expect(manager.isSaving()).toBe(false);
    });

    it('stays true while one of two writes is still in flight', () => {
      const first = sampleTask({ id: 'a' });
      const second = sampleTask({ id: 'b' });

      state.pendingWrites.set(
        new Map([
          ['a', first],
          ['b', second],
        ]),
      );

      state.pendingWrites.update((writes) => {
        const remaining = new Map(writes);
        remaining.delete('a');

        return remaining;
      });

      expect(manager.isSaving()).toBe(true);
    });
  });

  it('counts nothing while there is no task', () => {
    expect(manager.taskCount()).toBe(0);
    expect(manager.countByStatus()).toEqual({
      todo: 0,
      'in-progress': 0,
      done: 0,
    });
  });

  it('derives the count from the tasks', () => {
    state.tasks.set([sampleTask({ id: 'a' }), sampleTask({ id: 'b' })]);

    expect(manager.taskCount()).toBe(2);
  });

  it('derives one count per status, keeping the empty ones', () => {
    state.tasks.set([
      sampleTask({ id: 'a', status: 'todo' }),
      sampleTask({ id: 'b', status: 'todo' }),
      sampleTask({ id: 'c', status: 'done' }),
    ]);

    expect(manager.countByStatus()).toEqual({
      todo: 2,
      'in-progress': 0,
      done: 1,
    });
  });

  it('follows the state when a task changes status', () => {
    state.tasks.set([sampleTask({ id: 'a', status: 'todo' })]);
    expect(manager.countByStatus().todo).toBe(1);

    state.tasks.set([sampleTask({ id: 'a', status: 'done' })]);

    expect(manager.countByStatus()).toEqual({
      todo: 0,
      'in-progress': 0,
      done: 1,
    });
  });
});
