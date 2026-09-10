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
  describe('reordering one column', () => {
    const A = sampleTask({ id: 'a', status: 'todo' });
    const B = sampleTask({ id: 'b', status: 'todo' });
    const DONE = sampleTask({ id: 'c', status: 'done' });
    const OTHER = sampleTask({
      id: 'd',
      projectId: 'project-2',
      status: 'todo',
    });

    it('gives the column its new order, in the slots it already held', () => {
      expect(
        board.reordered([A, DONE, B], [B, A]).map((task) => task.id),
      ).toEqual(['b', 'c', 'a']);
    });

    it('leaves every task outside the column where it was', () => {
      expect(
        board.reordered([A, OTHER, DONE, B], [B, A]).map((task) => task.id),
      ).toEqual(['b', 'd', 'c', 'a']);
    });

    it('changes nothing when the order given is the order held', () => {
      const tasks = [A, DONE, B];

      expect(board.reordered(tasks, [A, B])).toEqual(tasks);
    });

    it('hands the list back untouched for an empty reorder', () => {
      expect(board.reordered([A, B], []).map((task) => task.id)).toEqual([
        'a',
        'b',
      ]);
    });

    /** The list is rebuilt, never mutated: the caller holds a signal's value. */
    it('does not touch the list it was given', () => {
      const tasks = [A, B];

      board.reordered(tasks, [B, A]);

      expect(tasks.map((task) => task.id)).toEqual(['a', 'b']);
    });
  });
});
