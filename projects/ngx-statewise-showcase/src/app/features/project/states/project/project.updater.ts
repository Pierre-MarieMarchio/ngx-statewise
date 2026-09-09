import { defineUpdater } from 'ngx-statewise';
import { ProjectState } from './project.state';
import { getAllProjectsActions, projectReset } from './project.action';

export const projectUpdater = defineUpdater(ProjectState, (on) => {
  on(projectReset, (state) => {
    state.projects.set([]);
    state.isLoading.set(false);
    state.isError.set(false);
  });

  on(getAllProjectsActions.request, (state) => {
    state.isLoading.set(true);
  });

  on(getAllProjectsActions.success, (state, projects) => {
    state.projects.set(projects);
    state.isLoading.set(false);
  });

  on(getAllProjectsActions.failure, (state) => {
    state.isError.set(true);
    state.isLoading.set(false);
  });
});
