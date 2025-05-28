import { inject, Injectable } from '@angular/core';
import { TaskState } from './task.state';
import { TaskUpdator } from './task.updator';
import { dispatch, dispatchAsync, registerLocalUpdator } from 'ngx-statewise';
import { getAllTaskActions, taskReset } from './task.action';
import { ITaskManager } from '@shared/app-common/tokens/task-manager/task-manager.interface';

@Injectable({
  providedIn: 'root',
})
export class TaskManager implements ITaskManager {
  private readonly taskStates = inject(TaskState);
  private readonly taskUpdator = inject(TaskUpdator);

  constructor() {
    registerLocalUpdator(this, this.taskUpdator);
  }

  public readonly tasks = this.taskStates.tasks.asReadonly();
  public readonly isError = this.taskStates.isError.asReadonly();
  public readonly isLoading = this.taskStates.isLoading.asReadonly();

  public getAll(): void {
    dispatch(getAllTaskActions.request(), this);
  }

  public async getAllAsync(): Promise<void> {
    await dispatchAsync(getAllTaskActions.request(), this);
  }

  public async reset(): Promise<void> {
    await dispatchAsync(taskReset.action(), this);
  }
}
