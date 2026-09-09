import { computed, inject, Injectable } from '@angular/core';
import { AUTH_SESSION } from '@app/features/common';
import { Task, TaskListColumnItem } from '../models';

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
