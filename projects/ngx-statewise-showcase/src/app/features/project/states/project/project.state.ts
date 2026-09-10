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

  /** One rename or one removal at a time, for the same reason as creating. */
  public isSaving = signal(false);

  /**
   * Why the last rename or removal was refused. Apart from `createError`
   * because they are shown in different places, and a refusal that outlives
   * the panel it belongs to is a sentence about nothing.
   */
  public saveError = signal<string | null>(null);
}
