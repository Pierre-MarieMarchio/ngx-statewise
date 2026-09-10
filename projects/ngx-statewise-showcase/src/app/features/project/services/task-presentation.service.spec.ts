import { TestBed } from '@angular/core/testing';
import { TaskPresentationService } from './task-presentation.service';

describe('TaskPresentationService', () => {
  let presentation: TaskPresentationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    presentation = TestBed.inject(TaskPresentationService);
  });

  it('names an icon for every status', () => {
    expect(presentation.statusIcon('todo')).toBe('pending');
    expect(presentation.statusIcon('in-progress')).toBe('hourglass_empty');
    expect(presentation.statusIcon('done')).toBe('check_circle');
  });

  it('names an icon for every priority', () => {
    expect(presentation.priorityIcon('low')).toBe('keyboard_arrow_down');
    expect(presentation.priorityIcon('medium')).toBe('remove');
    expect(presentation.priorityIcon('high')).toBe('keyboard_arrow_up');
  });

  it('spells a date out in full', () => {
    expect(presentation.formatDate('2026-03-09')).toBe('March 9, 2026');
  });

  describe('being overdue', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();

    it('is true for a past due date on a task still open', () => {
      expect(presentation.isOverdue(yesterday, 'todo')).toBe(true);
      expect(presentation.isOverdue(yesterday, 'in-progress')).toBe(true);
    });

    /** Finishing late is still finished: the panel must not keep nagging. */
    it('is false once the task is done, however late', () => {
      expect(presentation.isOverdue(yesterday, 'done')).toBe(false);
    });

    it('is false for a due date still ahead', () => {
      expect(presentation.isOverdue(tomorrow, 'todo')).toBe(false);
    });

    it('is false for a task carrying no due date', () => {
      expect(presentation.isOverdue(undefined, 'todo')).toBe(false);
      expect(presentation.isOverdue()).toBe(false);
    });
  });
});
