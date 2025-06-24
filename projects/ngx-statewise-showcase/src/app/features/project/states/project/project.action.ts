import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from 'ngx-statewise';
import { Project } from '../../models';

export const getAllProjectsActions = defineActionsGroup({
  source: 'Project',
  events: {
    request: emptyPayload,
    success: payload<Project[]>(),
    failure: emptyPayload,
  },
});

export const projectReset = defineSingleAction('PROJECT_RESET', emptyPayload);
