import { Injectable, signal } from '@angular/core';
import { Project } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class ProjectState {
  public projects = signal<Project[]>([]);
  public isLoading = signal(false);
  public isError = signal(false);

  /** One creation at a time, so a flag rather than a set of pending writes. */
  public isCreating = signal(false);

  /**
   * What the server said when it refused, kept so the form can repeat it. A
   * boolean would only be able to say that something went wrong.
   */
  public createError = signal<string | null>(null);
}
