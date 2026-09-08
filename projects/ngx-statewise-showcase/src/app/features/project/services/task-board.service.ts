import { Injectable } from '@angular/core';
import { STATUSES, Task, TaskStatus } from '@shared/app-common/models';

/**
 * What a column of the task board means.
 *
 * The geometry — laying the columns out, moving a card between them, wiring
 * the drop lists — belongs to the reusable board, which knows nothing of
 * tasks. What is left here is the translation: a column id is a task status,
 * and a card in another column is a task with another status.
 */
@Injectable({ providedIn: 'root' })
export class TaskBoardService {
  /** The columns a task board lays out, in order. */
  public readonly columns = STATUSES;

  /** The same task, in the column given. */
  public inColumn(task: Task, status: TaskStatus): Task {
    return { ...task, status };
  }

  /** The status a column id names, or `null` when it names none. */
  public asColumn(columnId: string): TaskStatus | null {
    return this.columns.includes(columnId as TaskStatus)
      ? (columnId as TaskStatus)
      : null;
  }
}
