import { TestBed } from '@angular/core/testing';
import { AUTH_SESSION } from '@app/features/common';
import { TEAM_DIRECTORY } from '@app/features/project/ports';
import {
  fakeAuthSession,
  FakeAuthSession,
  fakeTeamDirectory,
  FakeTeamDirectory,
  sampleTask,
} from '@testing/fake-managers';
import { TaskColumnsService } from './task-columns.service';

const READS = ['title', 'status', 'priority', 'dueDate', 'assignee'];

describe('TaskColumnsService', () => {
  let session: FakeAuthSession;
  let directory: FakeTeamDirectory;
  let taskColumns: TaskColumnsService;

  beforeEach(() => {
    session = fakeAuthSession();
    directory = fakeTeamDirectory();

    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_SESSION, useValue: session },
        { provide: TEAM_DIRECTORY, useValue: directory },
      ],
    });

    taskColumns = TestBed.inject(TaskColumnsService);
  });

  const cellOf = (columnDef: string, task = sampleTask()): string =>
    taskColumns
      .columns()
      .find((column) => column.columnDef === columnDef)
      ?.cell(task) ?? '';

  /** The action column ends every table, whatever the role sees before it. */
  it('shows an admin every column', () => {
    expect(taskColumns.displayedColumns()).toEqual([
      ...READS,
      'organisation',
      'open',
    ]);
  });

  it('withholds the column a role does not carry', () => {
    session.user.set({ userId: 'user-1', role: 'member' });

    expect(taskColumns.displayedColumns()).toEqual([...READS, 'open']);
  });

  it('withholds it from a visitor with no session at all', () => {
    session.user.set(null);

    expect(taskColumns.displayedColumns()).toEqual([...READS, 'open']);
  });

  it('follows the role as it changes', () => {
    session.user.set({ userId: 'user-1', role: 'member' });
    expect(taskColumns.columns()).toHaveLength(READS.length);

    session.user.set({ userId: 'user-1', role: 'admin' });
    expect(taskColumns.columns()).toHaveLength(READS.length + 1);
  });

  it('reads a cell off the task it is given', () => {
    const [title] = taskColumns.columns();

    expect(title?.cell({ title: 'Wire it up' } as never)).toBe('Wire it up');
  });

  describe('the two columns that read more than a field', () => {
    it('names the assignees, and says so when there are none', () => {
      expect(cellOf('assignee')).toBe('admin');
      expect(cellOf('assignee', sampleTask({ assignedUserIds: [] }))).toBe('—');
    });

    /** A directory arriving late redraws the column, rather than freezing ids. */
    it('follows the directory as it arrives', () => {
      directory.members.set([]);
      expect(cellOf('assignee')).toBe('user-1');

      directory.members.set([{ id: 'user-1', name: 'admin' }]);
      expect(cellOf('assignee')).toBe('admin');
    });

    it('reads a due date the way the panel does, and marks an absent one', () => {
      expect(cellOf('dueDate')).toBe('December 1, 2026');
      expect(cellOf('dueDate', sampleTask({ dueDate: undefined }))).toBe('—');
    });
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
        ['dueDate', '200px'],
        ['assignee', '200px'],
        ['organisation', '200px'],
      ]);
    });

    it('withholds the same column as the plain set', () => {
      session.user.set(null);

      expect(
        taskColumns.cappedColumns().map((column) => column.columnDef),
      ).toEqual(READS);
    });
  });
});
