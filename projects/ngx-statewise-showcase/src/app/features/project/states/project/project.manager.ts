import { computed, inject, Injectable } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { ProjectState } from './project.state';
import { projectUpdater } from './project.updater';
import {
  createProjectActions,
  deleteProjectActions,
  getAllProjectsActions,
  projectSelected,
  projectReset,
  updateProjectActions,
} from './project.action';
import { Project, ProjectDraft } from '../../models';
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

  public readonly selectedProjectId =
    this.projectStates.selectedProjectId.asReadonly();

  /**
   * The project the screens are looking at, derived from the id and the list
   * rather than stored beside them, so a reload that renamed it shows the new
   * name, and one that dropped it answers null.
   */
  public readonly selectedProject = computed<Project | null>(
    () =>
      this.projects().find(
        (project) => project.id === this.selectedProjectId(),
      ) ?? null,
  );

  /** Choosing one, or `null` to go back to all of them. */
  public selectProject(projectId: string | null): void {
    this.statewise.dispatch(projectSelected(projectId));
  }

  /**
   * Resolves once every effect this manager started has settled, whichever
   * action started it. The task manager waits on one action type instead.
   * Both are scoped to the handle, so neither hears the other.
   */
  public settled(): Promise<void> {
    return this.statewise.waitForAllEffects();
  }

  public readonly isCreating = this.projectStates.isCreating.asReadonly();
  public readonly createError = this.projectStates.createError.asReadonly();

  public readonly isSaving = this.projectStates.isSaving.asReadonly();
  public readonly saveError = this.projectStates.saveError.asReadonly();

  public getAll(): void {
    this.statewise.dispatch(getAllProjectsActions.request());
  }

  /**
   * Not on the shared kernel's port: auth never creates a project, and a port
   * gaining a member for a single caller inside one feature is the admission
   * test's first condition failing.
   */
  public createProject(draft: ProjectDraft): Promise<void> {
    return this.statewise.dispatchAsync(createProjectActions.request(draft));
  }

  /** Awaited, like creating one, so a panel knows whether to close itself. */
  public updateProject(project: Project): Promise<void> {
    return this.statewise.dispatchAsync(updateProjectActions.request(project));
  }

  public deleteProject(projectId: string): Promise<void> {
    return this.statewise.dispatchAsync(
      deleteProjectActions.request(projectId),
    );
  }

  public reset(): Promise<void> {
    return this.statewise.dispatchAsync(projectReset());
  }
}
