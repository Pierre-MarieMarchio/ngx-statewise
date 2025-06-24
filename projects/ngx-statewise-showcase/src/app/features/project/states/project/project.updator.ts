import { inject, Injectable } from '@angular/core';
import { IUpdator, ofType, UpdatorRegistry } from 'ngx-statewise';
import { ProjectState } from './project.state';
import { getAllProjectsActions, projectReset } from './project.action';
import { Project } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class ProjectUpdator implements IUpdator<ProjectState> {
  public readonly state = inject(ProjectState);

  public readonly updators: UpdatorRegistry<ProjectState> = {
    [ofType(projectReset.action)]: (state) => {
      state.projects.set(null);
      state.isLoading.set(false);
      state.isError.set(false);
    },

    [ofType(getAllProjectsActions.request)]: (state) => {
      state.isLoading.set(true);
    },

    [ofType(getAllProjectsActions.success)]: (state, payload: Project[]) => {
      state.projects.set(payload);
      state.isLoading.set(false);
    },

    [ofType(getAllProjectsActions.failure)]: (state) => {
      state.isError.set(true);
      state.isLoading.set(false);
    },
  };
}
