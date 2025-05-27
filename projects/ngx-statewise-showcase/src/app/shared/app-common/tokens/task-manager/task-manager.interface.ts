import { Signal } from '@angular/core';
import { Task } from '@app/core/fake-api/db.data';

export interface ITaskManager {
  tasks: Signal<Task[] | null>;
  isError: Signal<boolean>;
  isLoading: Signal<boolean>;

  getAllTask(): void;
  reset(): Promise<void>;
}
