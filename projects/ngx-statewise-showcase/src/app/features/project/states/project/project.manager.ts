import { inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { IProjectManager } from '@shared/app-common/tokens';
import { ProjectState } from './project.state';
import { projectUpdater } from './project.updater';
import { getAllProjectsActions, projectReset } from './project.action';

@Injectable({
  providedIn: 'root',
})
export class ProjectManager implements IProjectManager {
  private readonly projectStates = inject(ProjectState);
  private readonly statewise = injectStatewise(projectUpdater);

  public readonly projects = this.projectStates.projects.asReadonly();
  public readonly isError = this.projectStates.isError.asReadonly();
  public readonly isLoading = this.projectStates.isLoading.asReadonly();

  public getAll(): void {
    this.statewise.dispatch(getAllProjectsActions.request());
  }

  public getAllAsync(): Promise<void> {
    return this.statewise.dispatchAsync(getAllProjectsActions.request());
  }

  public reset(): Promise<void> {
    return this.statewise.dispatchAsync(projectReset());
  }
}
