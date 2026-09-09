import { defineUpdater } from 'ngx-statewise';
import { ProjectState } from './project.state';
import {
  createProjectActions,
  getAllProjectsActions,
  projectReset,
} from './project.action';

export const projectUpdater = defineUpdater(ProjectState, (on) => {
  on(projectReset, (state) => {
    state.projects.set([]);
    state.isLoading.set(false);
    state.isError.set(false);
    state.isCreating.set(false);
    state.createError.set(null);
  });

  on(getAllProjectsActions.request, (state) => {
    state.isLoading.set(true);
    state.isError.set(false);
  });

  on(getAllProjectsActions.success, (state, projects) => {
    state.projects.set(projects);
    state.isLoading.set(false);
  });

  on(getAllProjectsActions.failure, (state) => {
    state.isError.set(true);
    state.isLoading.set(false);
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
