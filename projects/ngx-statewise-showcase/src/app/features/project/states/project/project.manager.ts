import { inject, Injectable } from '@angular/core';
import { dispatch, dispatchAsync, registerLocalUpdator } from 'ngx-statewise';
import { IProjectManager } from '@shared/app-common/tokens';
import { ProjectState } from './project.state';
import { ProjectUpdator } from './project.updator';
import { getAllProjectsActions, projectReset } from './project.action';

@Injectable({
  providedIn: 'root',
})
export class ProjectManager implements IProjectManager {
  private readonly projectStates = inject(ProjectState);
  private readonly projectUpdator = inject(ProjectUpdator);

  constructor() {
    registerLocalUpdator(this, this.projectUpdator);
  }

  public readonly projects = this.projectStates.projects.asReadonly();
  public readonly isError = this.projectStates.isError.asReadonly();
  public readonly isLoading = this.projectStates.isLoading.asReadonly();

  public getAll(): void {
    dispatch(getAllProjectsActions.request(), this);
  }

  public async getAllAsync(): Promise<void> {
    await dispatchAsync(getAllProjectsActions.request(), this);
  }

  public async reset(): Promise<void> {
    await dispatchAsync(projectReset.action(), this);
  }

}
