import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from 'ngx-statewise';
import { Project, ProjectDraft } from '../../models';

export const getAllProjectsActions = defineActionsGroup({
  source: 'PROJECT',
  events: {
    request: emptyPayload,
    success: payload<Project[]>(),
    failure: emptyPayload,
  },
});

/**
 * Creation is pessimistic: without a server id there is nothing to show
 * optimistically that would not have to be reconciled later. The failure
 * carries the server's own sentence, because a refusal a form cannot repeat is
 * a refusal the user cannot act on.
 */
export const createProjectActions = defineActionsGroup({
  source: 'CREATE_PROJECT',
  events: {
    request: payload<ProjectDraft>(),
    success: payload<Project>(),
    failure: payload<string>(),
  },
});

export const projectReset = defineSingleAction('PROJECT_RESET', emptyPayload);
