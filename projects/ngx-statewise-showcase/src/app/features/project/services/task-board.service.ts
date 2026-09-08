import { Injectable } from '@angular/core';
import { STATUSES, Task, TaskStatus } from '@shared/app-common/models';

/** The prefix the boards build their drop-list ids from. */
const DROP_LIST_PREFIX = 'dropList_';

/**
 * How a board is laid out, and what moving a card between its columns means.
 *
 * This lived in the two board components, duplicated between them and with
 * two different ways of parsing a drop-list id. A component's class drives its
 * view — it turns an event into a call and a signal into something to render.
 * Deciding which column comes next is not that.
 */
@Injectable({ providedIn: 'root' })
export class TaskBoardService {
  /** The columns a board lays out, in order. */
  public readonly columns = STATUSES;

  /**
   * The same task one column over, or `null` when there is no column there.
   * Moving past either end does nothing rather than wrapping around.
   */
  public movedBy(task: Task, offset: number): Task | null {
    const target = this.columns.indexOf(task.status) + offset;

    if (target < 0 || target >= this.columns.length) {
      return null;
    }

    return this.inColumn(task, this.columns[target]);
  }

  /** The same task, in the column given. */
  public inColumn(task: Task, status: TaskStatus): Task {
    return { ...task, status };
  }

  /**
   * The column a drop-list id designates, or `null` when it designates none.
   *
   * The task board suffixes its ids with a project and the dashboard does not,
   * so the project part is optional here rather than parsed two ways.
   */
  public columnOfDropList(dropListId: string): TaskStatus | null {
    if (!dropListId.startsWith(DROP_LIST_PREFIX)) {
      return null;
    }

    const [column] = dropListId.slice(DROP_LIST_PREFIX.length).split('_');

    return this.columns.includes(column as TaskStatus)
      ? (column as TaskStatus)
      : null;
  }

  /** The id a board gives the drop list of one column, per project or not. */
  public dropListId(status: TaskStatus, projectId?: string): string {
    return projectId === undefined
      ? `${DROP_LIST_PREFIX}${status}`
      : `${DROP_LIST_PREFIX}${status}_${projectId}`;
  }

  /** Every drop-list id of one board, which is what connects them together. */
  public connectedDropListIds(projectId?: string): string[] {
    return this.columns.map((status) => this.dropListId(status, projectId));
  }
}
