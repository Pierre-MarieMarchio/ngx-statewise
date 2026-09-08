import { Signal } from '@angular/core';
import { Task } from '@app/core/fake-api/db.data';
import { TaskStatus } from '@shared/app-common/models';

export interface ITaskManager {
  tasks: Signal<Task[] | null>;
  isError: Signal<boolean>;
  /** Reading the list. */
  isLoading: Signal<boolean>;
  /** At least one write still in flight. */
  isSaving: Signal<boolean>;

  /** Derived from the tasks: how many there are, and how many per status. */
  taskCount: Signal<number>;
  countByStatus: Signal<Record<TaskStatus, number>>;

  getAll(): void;
  getAllAsync(): Promise<void>;
  update(task: Task): void;
  reset(): Promise<void>;
}
