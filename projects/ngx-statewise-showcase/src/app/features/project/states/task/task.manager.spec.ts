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
