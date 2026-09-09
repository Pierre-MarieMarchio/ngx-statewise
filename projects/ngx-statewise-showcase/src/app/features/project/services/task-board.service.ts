import { Injectable } from '@angular/core';
import { STATUSES, Task, TaskStatus } from '../models';

/**
 * What a column of the task board means.
 *
 * The geometry — laying the columns out, moving a card between them, wiring
 * the drop lists — belongs to the reusable board, which knows nothing of
 * tasks. What is left here is the translation: a column id is a task status,
 * and a card in another column is a task with another status.
 *
 * Plus the one ordering rule the reusable board cannot know, because a screen
 * shows several boards at once and it only ever sees its own.
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

  /**
   * The whole list, with one column's tasks in the order given.
   *
   * A reorder rearranges one column of one board and nothing else, so walk the
   * shown tasks and hand back that column's tasks in their new order as their
   * slots come up. Everything outside the column — the other statuses, the
   * other projects' boards — keeps its place.
   */
  public reordered(
    tasks: readonly Task[],
    inNewOrder: readonly Task[],
  ): Task[] {
    const remaining = [...inNewOrder];
    const moved = new Set(remaining.map((task) => task.id));

    return tasks.map((task) =>
      moved.has(task.id) ? (remaining.shift() ?? task) : task,
    );
  }
}
