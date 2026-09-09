import { defineUpdater, requestStatus } from 'ngx-statewise';
import { ProjectState } from './project.state';
import {
  createProjectActions,
  getAllProjectsActions,
  projectSelected,
  projectReset,
} from './project.action';

export const projectUpdater = defineUpdater(ProjectState, (on) => {
  on(projectReset, (state) => {
    state.projects.set([]);
    state.selectedProjectId.set(null);
    state.isLoading.set(false);
    state.isError.set(false);
    state.isCreating.set(false);
    state.createError.set(null);
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
});
