import { Task } from '../../models';
import { defineUpdater } from 'ngx-statewise';
import {
  createTaskActions,
  getAllTaskActions,
  taskReset,
  updateTaskActions,
} from './task.action';
import { TaskState } from './task.state';

/*
 * `isLoading` belongs to reading the list, and nothing else touches it. A write
 * in flight shows through `pendingWrites`, which the manager derives `isSaving`
 * from — a single flag would be cleared by the first answer of N writes, and
 * the spinner would stop while the rest were still going.
 */

/** Puts one task back in a list, leaving the others in place and in order. */
const carrying =
  (updated: Task) =>
  (tasks: Task[]): Task[] =>
    tasks.map((task) => (task.id === updated.id ? updated : task));

/** Drops one entry, without mutating the map a view may already be reading. */
const without =
  (taskId: string) =>
  (writes: Map<string, Task>): Map<string, Task> => {
    const remaining = new Map(writes);
    remaining.delete(taskId);

    return remaining;
  };

export const taskUpdater = defineUpdater(TaskState, (on) => {
  on(taskReset, (state) => {
    state.tasks.set([]);
    state.pendingWrites.set(new Map());
    state.isLoading.set(false);
    state.isError.set(false);
    state.isCreating.set(false);
    state.createError.set(null);
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

  /**
   * Optimistic: the card moves before the server has answered, and the version
   * it replaced is kept so a failure can put that one card back.
   *
   * A second write to the same card overwrites its entry, so the point of
   * return is the last state the view showed rather than the last one the
   * server confirmed. That is what the user sees, which is what a rollback
   * should restore.
   */
  on(updateTaskActions.request, (state, task) => {
    state.isError.set(false);

    const replaced = state.tasks().find((existing) => existing.id === task.id);

    if (replaced) {
      state.pendingWrites.update((writes) =>
        new Map(writes).set(task.id, replaced),
      );
    }

    state.tasks.update(carrying(task));
  });

  on(updateTaskActions.success, (state, updatedTask) => {
    state.pendingWrites.update(without(updatedTask.id));
    state.tasks.update(carrying(updatedTask));
  });

  on(createTaskActions.request, (state) => {
    state.isCreating.set(true);
    state.createError.set(null);
  });

  /** The server answered with the task, so the list already holds the truth. */
  on(createTaskActions.success, (state, task) => {
    state.isCreating.set(false);
    state.tasks.update((tasks) => [...tasks, task]);
  });

  on(createTaskActions.failure, (state, reason) => {
    state.isCreating.set(false);
    state.createError.set(reason);
  });

  on(updateTaskActions.failure, (state, taskId) => {
    state.isError.set(true);

    const replaced = state.pendingWrites().get(taskId);
    state.pendingWrites.update(without(taskId));

    if (replaced) {
      state.tasks.update(carrying(replaced));
    }
  });
});
