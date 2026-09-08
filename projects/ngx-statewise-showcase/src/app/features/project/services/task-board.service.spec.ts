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

  describe('moving a card', () => {
    it('hands back the same task in the next column', () => {
      const task = sampleTask({ status: 'todo' });

      expect(board.movedBy(task, 1)).toEqual({
        ...task,
        status: 'in-progress',
      });
    });

    it('hands back the same task in the previous column', () => {
      const task = sampleTask({ status: 'done' });

      expect(board.movedBy(task, -1)).toEqual({
        ...task,
        status: 'in-progress',
      });
    });

    /** Past either end is a no-op, not a wrap-around to the other side. */
    it('answers nothing past either end', () => {
      expect(board.movedBy(sampleTask({ status: 'todo' }), -1)).toBeNull();
      expect(board.movedBy(sampleTask({ status: 'done' }), 1)).toBeNull();
    });

    it('leaves the task it was given untouched', () => {
      const task = sampleTask({ status: 'todo' });

      board.movedBy(task, 1);

      expect(task.status).toBe('todo');
    });
  });

  describe('drop-list ids', () => {
    it('names a column, with or without a project', () => {
      expect(board.dropListId('todo')).toBe('dropList_todo');
      expect(board.dropListId('todo', 'project-1')).toBe(
        'dropList_todo_project-1',
      );
    });

    /**
     * One parser for both shapes: the task board suffixes with a project and
     * the dashboard does not, and each used to slice the string its own way.
     */
    it('reads the column back out of either shape', () => {
      expect(board.columnOfDropList('dropList_in-progress')).toBe(
        'in-progress',
      );
      expect(board.columnOfDropList('dropList_in-progress_project-1')).toBe(
        'in-progress',
      );
    });

    it('answers nothing for an id it does not recognise', () => {
      expect(board.columnOfDropList('dropList_nowhere')).toBeNull();
      expect(board.columnOfDropList('somethingElse_todo')).toBeNull();
      expect(board.columnOfDropList('')).toBeNull();
    });

    it('connects every column of one board to the others', () => {
      expect(board.connectedDropListIds('project-1')).toEqual([
        'dropList_todo_project-1',
        'dropList_in-progress_project-1',
        'dropList_done_project-1',
      ]);
    });
  });
});
