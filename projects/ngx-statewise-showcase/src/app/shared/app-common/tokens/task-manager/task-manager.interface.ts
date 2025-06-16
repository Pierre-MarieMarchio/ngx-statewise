import { Signal } from '@angular/core';
import { Task } from '@app/core/fake-api/db.data';

export interface ITaskManager {
  tasks: Signal<Task[] | null>;
  isError: Signal<boolean>;
  isLoading: Signal<boolean>;

  getAll(): void;
  getAllAsync(): Promise<void>;
  update(task: Task): void
  reset(): Promise<void>;
}
