import { Task } from '../../models';
import { defineUpdater, requestStatus } from 'ngx-statewise';
import {
  createTaskActions,
  deleteTaskActions,
  getAllTaskActions,
  searchCleared,
  searchTaskActions,
  taskReset,
  updateTaskActions,
} from './task.action';
import { TaskState } from './task.state';

/*
 * `isLoading` belongs to reading the list, and nothing else touches it. A write
 * in flight shows through `pendingWrites`, which the manager derives `isSaving`
 * from. A single flag would be cleared by the first answer of N writes, and
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
    state.matches.set(null);
    state.isSearching.set(false);
    state.searchFailed.set(false);
    state.pendingWrites.set(new Map());
    state.isLoading.set(false);
    state.isError.set(false);
    state.saveError.set(null);
    state.isCreating.set(false);
    state.createError.set(null);
  });

  // The two flags of the read flow, wired once. `request` clearing the error
  // of the previous attempt is the part this stops anyone from forgetting.
  requestStatus(on, getAllTaskActions, {
    loading: (state) => state.isLoading,
    error: (state) => state.isError,
    onSuccess: (state, tasks) => {
      state.tasks.set(tasks);
    },
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
    state.saveError.set(null);

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

  /*
   * The same helper the read flow uses, so `request` clearing the previous
   * attempt's error is not something anyone has to remember here either.
   */
  requestStatus(on, searchTaskActions, {
    loading: (state) => state.isSearching,
    error: (state) => state.searchFailed,
    onSuccess: (state, matches) => {
      state.matches.set(matches);
    },
  });

  /*
   * An updater with no effect behind it: emptying the box is a decision, not a
   * request. It also cancels a search in flight. See the effect's `cancelOn`.
   */
  on(searchCleared, (state) => {
    state.matches.set(null);
    state.isSearching.set(false);
    state.searchFailed.set(false);
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

  on(deleteTaskActions.request, (state) => {
    state.saveError.set(null);
  });

  /**
   * Out of both lists, or a search that matched it would go on showing a row
   * the server no longer has.
   */
  on(deleteTaskActions.success, (state, taskId) => {
    state.tasks.update((tasks) => tasks.filter((task) => task.id !== taskId));
    state.matches.update((matches) =>
      matches === null ? null : matches.filter((task) => task.id !== taskId),
    );
  });

  on(deleteTaskActions.failure, (state, reason) => {
    state.saveError.set(reason);
  });

  on(updateTaskActions.failure, (state, { taskId, reason }) => {
    state.saveError.set(reason);

    const replaced = state.pendingWrites().get(taskId);
    state.pendingWrites.update(without(taskId));

    if (replaced) {
      state.tasks.update(carrying(replaced));
    }
  });
});
