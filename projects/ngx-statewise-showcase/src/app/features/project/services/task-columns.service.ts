import { computed, inject, Injectable } from '@angular/core';
import { AUTH_SESSION } from '@app/features/common';
import { Task, TaskListColumnItem } from '../models';
import { TEAM_DIRECTORY } from '../ports';
import { TaskPresentationService } from './task-presentation.service';

/** What a cell shows for a field the task does not carry. */
const NOTHING = '—';

/** The action column, spelled the same way by the four templates. */
const OPEN_TASK_COLUMN = 'open';

/**
 * Which columns a role may see.
 *
 * Three tables wrote the same filter and very nearly the same four
 * definitions, and a fourth wrote neither: it showed a fixed three and filled
 * its column names in `ngOnInit`, from a literal that never changed. "Which
 * role sees which column" is a rule about the domain, not a detail of a table.
 */
@Injectable({ providedIn: 'root' })
export class TaskColumnsService {
  private readonly session = inject(AUTH_SESSION);
  private readonly directory = inject(TEAM_DIRECTORY);
  private readonly presentation = inject(TaskPresentationService);

  /** The order the tables show, and the only place these are declared. */
  private readonly all: readonly TaskListColumnItem[] = [
    {
      columnDef: 'title',
      header: 'Title',
      cell: (task: Task) => `${task.title}`,
    },
    {
      columnDef: 'status',
      header: 'Status',
      cell: (task: Task) => `${task.status}`,
    },
    {
      columnDef: 'priority',
      header: 'Priority',
      cell: (task: Task) => `${task.priority}`,
    },
    /*
     * Both read a field the tables never showed, although the panel did and
     * the "My Tasks" tab sorted by one of them. The cells are arrow functions
     * called from a template, so the signal each one reads is a dependency of
     * the view that calls it: a directory arriving late redraws the column.
     */
    {
      columnDef: 'dueDate',
      header: 'Due date',
      cell: (task: Task) =>
        task.dueDate ? this.presentation.formatDate(task.dueDate) : NOTHING,
    },
    {
      columnDef: 'assignee',
      header: 'Assigned to',
      cell: (task: Task) => {
        const names = (task.assignedUserIds ?? []).map((userId) =>
          this.directory.nameOf(userId),
        );

        return names.length > 0 ? names.join(', ') : NOTHING;
      },
    },
    {
      columnDef: 'organisation',
      header: 'Organisation',
      cell: (task: Task) => `${task.organizationId}`,
      requiredRole: 'admin',
    },
  ];

  public readonly columns = computed(() => {
    const role = this.session.user()?.role;

    return this.all.filter(
      (column) => !column.requiredRole || column.requiredRole === role,
    );
  });

  /**
   * What a table renders: the columns the role may see, then the action that
   * opens a row. The action is not one of `all` — no role decides it and it
   * reads nothing off the task — but it is the keyboard path to the detail
   * panel, so every table ends with it.
   */
  public readonly displayedColumns = computed(() => [
    ...this.columns().map((column) => column.columnDef),
    OPEN_TASK_COLUMN,
  ]);

  /**
   * The same columns for the board's table, which sits inside an accordion and
   * caps its width. The title is exempt: it carries the longest content and is
   * what identifies the row, so it keeps the slack the others give up.
   */
  public readonly cappedColumns = computed(() =>
    this.columns().map((column) =>
      column.columnDef === 'title' ? column : { ...column, maxWidth: '200px' },
    ),
  );
}
