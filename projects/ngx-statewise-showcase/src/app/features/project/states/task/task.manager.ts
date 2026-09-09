import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { TaskState } from './task.state';
import { taskUpdater } from './task.updater';
import {
  createTaskActions,
  getAllTaskActions,
  searchCleared,
  searchTaskActions,
  taskReset,
  updateTaskActions,
} from './task.action';
import { Task, TaskDraft } from '../../models';
import { ITaskReload } from '@app/features/common';
import { TaskSelectionService } from '../../services';

@Injectable({
  providedIn: 'root',
})
export class TaskManager implements ITaskReload {
  private readonly taskStates = inject(TaskState);
  private readonly statewise = injectStatewise(taskUpdater);
  private readonly selection = inject(TaskSelectionService);

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

  /** Why the last write was refused, in the server's own words. */
  public readonly saveError = this.taskStates.saveError.asReadonly();

  public readonly isCreating = this.taskStates.isCreating.asReadonly();
  public readonly createError = this.taskStates.createError.asReadonly();

  public readonly isSearching = this.taskStates.isSearching.asReadonly();
  public readonly searchFailed = this.taskStates.searchFailed.asReadonly();

  /** Whether a search is on, which is not the same as whether it matched. */
  public readonly isFiltered = computed(
    () => this.taskStates.matches() !== null,
  );

  /**
   * What the views show: the matches while a search is on, the whole list
   * otherwise. Derived from two states rather than stored, so nothing has to
   * remember to put the full list back when the box is emptied.
   */
  public readonly visibleTasks = computed(
    () => this.taskStates.matches() ?? this.tasks(),
  );

  public readonly taskCount = computed(() => this.tasks().length);

  /**
   * The counts over every task. The same rule scoped to one project is
   * `CurrentProjectService`'s, and both ask `TaskSelectionService` — a manager
   * may inject a service of its own feature when the alternative is writing
   * its rule twice.
   */
  public readonly countByStatus = computed(() =>
    this.selection.countByStatus(this.tasks()),
  );

  /**
   * Resolves once the reload this manager started has settled.
   *
   * A cascade from another feature — a login reloading the tasks — dispatches
   * through this manager's own handle, and observation is scoped exactly like
   * dispatch. So awaiting the action that started the cascade does not cover
   * it, and this is what does.
   */
  public reloaded(): Promise<void> {
    return this.statewise.waitForEffect(getAllTaskActions.request);
  }

  public getAll(): void {
    this.statewise.dispatch(getAllTaskActions.request());
  }

  public getAllAsync(): Promise<void> {
    return this.statewise.dispatchAsync(getAllTaskActions.request());
  }

  /**
   * Asks the server. The debounce is the caller's — how long to wait for a
   * typist to stop is a question about a keyboard, not about state.
   */
  public search(query: string): void {
    this.statewise.dispatch(searchTaskActions.request(query));
  }

  /** Drops the filter, and cancels a search still in flight. */
  public clearSearch(): void {
    this.statewise.dispatch(searchCleared());
  }

  public update(task: Task): void {
    this.statewise.dispatch(updateTaskActions.request(task));
  }

  /** Not on the shared kernel's port — see ProjectManager.createProject. */
  public createTask(draft: TaskDraft): Promise<void> {
    return this.statewise.dispatchAsync(createTaskActions.request(draft));
  }

  public reset(): Promise<void> {
    return this.statewise.dispatchAsync(taskReset());
  }
}
