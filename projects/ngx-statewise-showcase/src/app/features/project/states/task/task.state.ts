import { Injectable, signal } from '@angular/core';
import { Task } from '../../models';

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

  /** One creation at a time — see ProjectState for why a flag suffices. */
  public isCreating = signal(false);

  /** What the server said when it refused, so the form can repeat it. */
  public createError = signal<string | null>(null);
}
