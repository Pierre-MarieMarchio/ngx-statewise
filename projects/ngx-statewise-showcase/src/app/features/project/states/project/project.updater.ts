import { defineUpdater, requestStatus } from 'ngx-statewise';
import { ProjectState } from './project.state';
import {
  createProjectActions,
  deleteProjectActions,
  getAllProjectsActions,
  projectSelected,
  projectReset,
  updateProjectActions,
} from './project.action';

export const projectUpdater = defineUpdater(ProjectState, (on) => {
  on(projectReset, (state) => {
    state.projects.set([]);
    state.selectedProjectId.set(null);
    state.isLoading.set(false);
    state.isError.set(false);
    state.isCreating.set(false);
    state.createError.set(null);
    state.isSaving.set(false);
    state.saveError.set(null);
  });

  // Where the bug was: `request` did not clear `isError`, so a reload that
  // succeeded left a stale failure up until the next logout. The helper writes
  // that line, so it cannot go missing again.
  requestStatus(on, getAllProjectsActions, {
    loading: (state) => state.isLoading,
    error: (state) => state.isError,
    onSuccess: (state, projects) => {
      state.projects.set(projects);

      /*
       * A selection the reload no longer holds is no selection.
       *
       * Leaving the id would not show the wrong project — the derivation finds
       * nothing and answers null — but every list scoped by that id would
       * filter down to nothing, so the screens would go empty rather than back
       * to showing everything.
       */
      const selected = state.selectedProjectId();

      if (
        selected !== null &&
        !projects.some((project) => project.id === selected)
      ) {
        state.selectedProjectId.set(null);
      }
    },
  });

  on(projectSelected, (state, projectId) => {
    state.selectedProjectId.set(projectId);
  });

  on(createProjectActions.request, (state) => {
    state.isCreating.set(true);
    state.createError.set(null);
  });

  /**
   * The new project joins the list here rather than waiting for a reload: the
   * server answered with it, so the state already holds the truth.
   */
  on(createProjectActions.success, (state, project) => {
    state.isCreating.set(false);
    state.projects.update((projects) => [...projects, project]);
  });

  on(createProjectActions.failure, (state, reason) => {
    state.isCreating.set(false);
    state.createError.set(reason);
  });

  /*
   * Renaming and removing share the two flags: one panel does one of them at a
   * time, and a refusal belongs to whichever was asked for.
   */
  on(updateProjectActions.request, (state) => {
    state.isSaving.set(true);
    state.saveError.set(null);
  });

  on(updateProjectActions.success, (state, project) => {
    state.isSaving.set(false);
    state.projects.update((projects) =>
      projects.map((existing) =>
        existing.id === project.id ? project : existing,
      ),
    );
  });

  on(updateProjectActions.failure, (state, reason) => {
    state.isSaving.set(false);
    state.saveError.set(reason);
  });

  on(deleteProjectActions.request, (state) => {
    state.isSaving.set(true);
    state.saveError.set(null);
  });

  /** A project that no longer exists cannot go on being the current one. */
  on(deleteProjectActions.success, (state, projectId) => {
    state.isSaving.set(false);
    state.projects.update((projects) =>
      projects.filter((project) => project.id !== projectId),
    );

    if (state.selectedProjectId() === projectId) {
      state.selectedProjectId.set(null);
    }
  });

  on(deleteProjectActions.failure, (state, reason) => {
    state.isSaving.set(false);
    state.saveError.set(reason);
  });
});
