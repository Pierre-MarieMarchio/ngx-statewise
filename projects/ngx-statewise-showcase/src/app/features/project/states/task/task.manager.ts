import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { TaskState } from './task.state';
import { taskUpdater } from './task.updater';
import { getAllTaskActions, taskReset, updateTaskActions } from './task.action';
import { ITaskManager } from '@shared/app-common/tokens/task-manager/task-manager.interface';
import { STATUSES, Task, TaskStatus } from '@shared/app-common/models';

@Injectable({
  providedIn: 'root',
})
export class TaskManager implements ITaskManager {
  private readonly taskStates = inject(TaskState);
  private readonly statewise = injectStatewise(taskUpdater);

  public readonly tasks = this.taskStates.tasks.asReadonly();
  public readonly isError = this.taskStates.isError.asReadonly();
  public readonly isLoading = this.taskStates.isLoading.asReadonly();

  /**
   * Derived from the writes in flight rather than stored, so it stays true
   * until the last of them has answered.
   */
  public readonly isSaving = computed(
    () => this.taskStates.pendingWrites().size > 0,
  );

  public readonly taskCount = computed(() => this.tasks().length);

  /**
   * Every status is present even at zero, so a view over it never has to
   * guess which keys exist.
   */
  public readonly countByStatus = computed(() => {
    const tasks = this.tasks();

    return STATUSES.reduce(
      (counts, status) => ({
        ...counts,
        [status]: tasks.filter((task) => task.status === status).length,
      }),
      {} as Record<TaskStatus, number>,
    );
  });

  public getAll(): void {
    this.statewise.dispatch(getAllTaskActions.request());
  }

  public getAllAsync(): Promise<void> {
    return this.statewise.dispatchAsync(getAllTaskActions.request());
  }

  public update(task: Task): void {
    this.statewise.dispatch(updateTaskActions.request(task));
  }

  public reset(): Promise<void> {
    return this.statewise.dispatchAsync(taskReset());
  }
}
