import { inject, Injectable } from '@angular/core';
import { IUpdator, ofType, UpdatorRegistry } from 'ngx-statewise';
import { TaskState } from './task.state';
import { getAllTaskActions, taskReset, updateTaskActions } from './task.action';
import { Task } from '@app/core/fake-api/db.data';

@Injectable({
  providedIn: 'root',
})
export class TaskUpdator implements IUpdator<TaskState> {
  public readonly state = inject(TaskState);

  public readonly updators: UpdatorRegistry<TaskState> = {
    [ofType(taskReset.action)]: (state) => {
      state.tasks.set([]);
      state.isLoading.set(false);
      state.isError.set(false);
    },

    [ofType(getAllTaskActions.request)]: (state) => {
      state.isLoading.set(true);
      state.isError.set(false);
    },

    [ofType(getAllTaskActions.success)]: (state, payload: Task[]) => {
      state.tasks.set(payload);
      state.isLoading.set(false);
    },

    [ofType(getAllTaskActions.failure)]: (state) => {
      state.isError.set(true);
      state.isLoading.set(false);
    },

    [ofType(updateTaskActions.request)]: (state) => {
      state.isLoading.set(true);
      state.isError.set(false);
    },

    [ofType(updateTaskActions.success)]: (state, payload: Task) => {
      state.isLoading.set(false);
      this.updateTask(payload);
    },

    [ofType(updateTaskActions.failure)]: (state) => {
      state.isError.set(true);
      state.isLoading.set(false);
    },
  };

  private updateTask(newTask: Task) {
    this.state.tasks.update((tasks) =>
      tasks.map((task) => (task.id === newTask.id ? newTask : task))
    );
  }


}
