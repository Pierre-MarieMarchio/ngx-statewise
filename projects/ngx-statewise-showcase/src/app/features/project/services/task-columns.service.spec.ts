import { TestBed } from '@angular/core/testing';
import { AUTH_SESSION } from '@app/features/common';
import { fakeAuthSession, FakeAuthSession } from '@testing/fake-managers';
import { TaskColumnsService } from './task-columns.service';

describe('TaskColumnsService', () => {
  let session: FakeAuthSession;
  let taskColumns: TaskColumnsService;

  beforeEach(() => {
    session = fakeAuthSession();

    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_SESSION, useValue: session }],
    });

    taskColumns = TestBed.inject(TaskColumnsService);
  });

  /** The action column ends every table, whatever the role sees before it. */
  it('shows an admin every column', () => {
    expect(taskColumns.displayedColumns()).toEqual([
      'title',
      'status',
      'priority',
      'organisation',
      'open',
    ]);
  });

  it('withholds the column a role does not carry', () => {
    session.user.set({ userId: 'user-1', role: 'member' });

    expect(taskColumns.displayedColumns()).toEqual([
      'title',
      'status',
      'priority',
      'open',
    ]);
  });

  it('withholds it from a visitor with no session at all', () => {
    session.user.set(null);

    expect(taskColumns.displayedColumns()).toEqual([
      'title',
      'status',
      'priority',
      'open',
    ]);
  });

  it('follows the role as it changes', () => {
    session.user.set({ userId: 'user-1', role: 'member' });
    expect(taskColumns.columns()).toHaveLength(3);

    session.user.set({ userId: 'user-1', role: 'admin' });
    expect(taskColumns.columns()).toHaveLength(4);
  });

  it('reads a cell off the task it is given', () => {
    const [title] = taskColumns.columns();

    expect(title?.cell({ title: 'Wire it up' } as never)).toBe('Wire it up');
  });

  describe('the capped variant the board uses', () => {
    it('caps every column but the title', () => {
      expect(
        taskColumns
          .cappedColumns()
          .map((column) => [column.columnDef, column.maxWidth]),
      ).toEqual([
        ['title', undefined],
        ['status', '200px'],
        ['priority', '200px'],
        ['organisation', '200px'],
      ]);
    });

    it('withholds the same column as the plain set', () => {
      session.user.set(null);

      expect(
        taskColumns.cappedColumns().map((column) => column.columnDef),
      ).toEqual(['title', 'status', 'priority']);
    });
  });
});
