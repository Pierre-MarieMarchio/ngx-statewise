import { TestBed } from '@angular/core/testing';
import { sampleTask } from '@testing/fake-managers';
import { TaskBoardService } from './task-board.service';

describe('TaskBoardService', () => {
  let board: TaskBoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    board = TestBed.inject(TaskBoardService);
  });

  it('lays out the columns in order', () => {
    expect([...board.columns]).toEqual(['todo', 'in-progress', 'done']);
  });

  it('puts a task in another column without touching the original', () => {
    const task = sampleTask({ status: 'todo' });

    expect(board.inColumn(task, 'done')).toEqual({ ...task, status: 'done' });
    expect(task.status).toBe('todo');
  });

  /** The reusable board speaks column ids; only this knows they are statuses. */
  it('reads a status out of a column id, and refuses anything else', () => {
    expect(board.asColumn('in-progress')).toBe('in-progress');
    expect(board.asColumn('nowhere')).toBeNull();
    expect(board.asColumn('')).toBeNull();
  });
});
