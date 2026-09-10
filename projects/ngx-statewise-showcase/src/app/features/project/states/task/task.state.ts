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

  /**
   * Why the last write was refused, and `null` when none was.
   *
   * Apart from `isError`, which belongs to reading the list: a refused write
   * is not a list that failed to load, and it used to light that banner and
   * offer a "Try again" that reloaded everything.
   */
  public saveError = signal<string | null>(null);

  /**
   * What the last search answered, and `null` when there is no search.
   *
   * `null` rather than an empty array on purpose: "nobody searched" and "the
   * search matched nothing" are two different screens, and only one of them
   * should say so.
   */
  public matches = signal<Task[] | null>(null);
  public isSearching = signal(false);
  public searchFailed = signal(false);

  /** One creation at a time. See ProjectState for why a flag suffices. */
  public isCreating = signal(false);

  /** What the server said when it refused, so the form can repeat it. */
  public createError = signal<string | null>(null);
}
