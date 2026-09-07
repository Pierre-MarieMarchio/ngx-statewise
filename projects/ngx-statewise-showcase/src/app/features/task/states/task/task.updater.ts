import { defineUpdater } from 'ngx-statewise';
import { TaskState } from './task.state';
import { getAllTaskActions, taskReset, updateTaskActions } from './task.action';

export const taskUpdater = defineUpdater(TaskState, (on) => {
  on(taskReset, (state) => {
    state.tasks.set([]);
    state.isLoading.set(false);
    state.isError.set(false);
  });

  on(getAllTaskActions.request, (state) => {
    state.isLoading.set(true);
    state.isError.set(false);
  });

  on(getAllTaskActions.success, (state, tasks) => {
    state.tasks.set(tasks);
    state.isLoading.set(false);
  });

  on(getAllTaskActions.failure, (state) => {
    state.isError.set(true);
    state.isLoading.set(false);
  });

  on(updateTaskActions.request, (state) => {
    state.isLoading.set(true);
    state.isError.set(false);
  });

  on(updateTaskActions.success, (state, updatedTask) => {
    state.isLoading.set(false);
    state.tasks.update((tasks) =>
      tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
  });

  on(updateTaskActions.failure, (state) => {
    state.isError.set(true);
    state.isLoading.set(false);
  });
});
