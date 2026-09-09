import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { ProjectState } from './project.state';
import { projectUpdater } from './project.updater';
import { getAllProjectsActions, projectReset } from './project.action';
import { IProjectReload } from '@app/features/common';

@Injectable({
  providedIn: 'root',
})
export class ProjectManager implements IProjectReload {
  private readonly projectStates = inject(ProjectState);
  private readonly statewise = injectStatewise(projectUpdater);

  public readonly projects = this.projectStates.projects.asReadonly();
  public readonly isError = this.projectStates.isError.asReadonly();
  public readonly isLoading = this.projectStates.isLoading.asReadonly();

  public readonly projectCount = computed(() => this.projects().length);

  /**
   * Resolves once every effect this manager started has settled, whichever
   * action started it. The task manager waits on one action type instead —
   * both are scoped to the handle, so neither hears the other.
   */
  public settled(): Promise<void> {
    return this.statewise.waitForAllEffects();
  }

  public getAll(): void {
    this.statewise.dispatch(getAllProjectsActions.request());
  }

  public reset(): Promise<void> {
    return this.statewise.dispatchAsync(projectReset());
  }
}
