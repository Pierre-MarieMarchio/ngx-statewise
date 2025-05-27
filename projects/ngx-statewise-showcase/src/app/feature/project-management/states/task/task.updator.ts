import { inject, Injectable } from '@angular/core';
import { IUpdator, ofType, UpdatorRegistry } from 'ngx-statewise';
import { TaskState } from './task.state';
import { getAllTaskActions, taskReset } from './task.action';
import { Task } from '@app/core/fake-api/db.data';

@Injectable({
  providedIn: 'root',
})
export class TaskUpdator implements IUpdator<TaskState> {
  public readonly state = inject(TaskState);

  public readonly updators: UpdatorRegistry<TaskState> = {
    [ofType(taskReset.action)]: (state) => {
      state.tasks.set(null);
      state.isLoading.set(false);
      state.isError.set(false);
    },

    [ofType(getAllTaskActions.request)]: (state) => {
      state.isLoading.set(true);
    },

    [ofType(getAllTaskActions.success)]: (state, payload: Task[]) => {
      state.tasks.set(payload);
      state.isLoading.set(false);
    },

    [ofType(getAllTaskActions.failure)]: (state) => {
      state.isError.set(true);
      state.isLoading.set(false);
    },
  };
}
