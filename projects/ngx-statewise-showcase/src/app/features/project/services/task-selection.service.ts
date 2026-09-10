import { Injectable } from '@angular/core';
import { STATUSES, Task, TaskStatus } from '../models';

/**
 * Which tasks a view is looking at. Pure criteria, so nothing here depends on
 * who is signed in. That is [AssignedTasksService]'s question.
 */
@Injectable({ providedIn: 'root' })
export class TaskSelectionService {
  public inStatus(tasks: readonly Task[], status: TaskStatus): Task[] {
    return tasks.filter((task) => task.status === status);
  }

  public ofProject(tasks: readonly Task[], projectId: string): Task[] {
    return tasks.filter((task) => task.projectId === projectId);
  }

  /**
   * How many tasks sit in each status, every status present even at zero, so a
   * view over the counts never has to guess which keys exist.
   *
   * Here rather than in the manager because two callers want it now: the
   * manager, over everything, and the current project, over its own slice.
   */
  public countByStatus(tasks: readonly Task[]): Record<TaskStatus, number> {
    return STATUSES.reduce(
      (counts, status) => ({
        ...counts,
        [status]: this.inStatus(tasks, status).length,
      }),
      {} as Record<TaskStatus, number>,
    );
  }
}
