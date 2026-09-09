import { Injectable, signal } from '@angular/core';
import { Project } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class ProjectState {
  public projects = signal<Project[]>([]);
  public isLoading = signal(false);
  public isError = signal(false);

  /**
   * The project the screens are looking at, and `null` for all of them.
   *
   * An id rather than the project: the row itself is in `projects`, and two
   * copies of it would be one to keep in step. Everything on screen derives
   * from this one field and that list.
   */
  public selectedProjectId = signal<string | null>(null);

  /** One creation at a time, so a flag rather than a set of pending writes. */
  public isCreating = signal(false);

  /**
   * What the server said when it refused, kept so the form can repeat it. A
   * boolean would only be able to say that something went wrong.
   */
  public createError = signal<string | null>(null);
}
