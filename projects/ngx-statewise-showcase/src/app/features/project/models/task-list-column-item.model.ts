import { Task } from '.';

/**
 * How a cell is drawn, when the domain has a shape for it.
 *
 * `'text'` is the default and covers most of a table. The other three name the
 * values the application already draws elsewhere. A status and a priority are
 * coloured marks in the details panel, and an assignee is a person's name.
 * This is what stops a table from being the one place they read as grey
 * lowercase words instead.
 */
export type TaskColumnKind = 'text' | 'status' | 'priority' | 'people';

export interface TaskListColumnItem {
  columnDef: string;
  header: string;
  /** The cell as text: what a badge column says to anything that cannot draw. */
  cell: (element: Task) => string;
  kind?: TaskColumnKind;
  requiredRole?: string;
  width?: string;
  maxWidth?: string;
}
