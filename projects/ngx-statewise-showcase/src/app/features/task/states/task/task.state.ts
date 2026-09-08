import { Injectable, signal } from '@angular/core';
import { Task } from '@app/core/fake-api/db.data';

@Injectable({
  providedIn: 'root',
})
export class TaskState {
  public tasks = signal<Task[]>([]);
  public isLoading = signal(false);
  public isError = signal(false);

  /**
   * The version each write in flight replaced, keyed by task id.
   *
   * One entry per write is the whole point: a failure restores its own card
   * and leaves the others where the user dropped them.
   */
  public pendingWrites = signal<Map<string, Task>>(new Map());
}
