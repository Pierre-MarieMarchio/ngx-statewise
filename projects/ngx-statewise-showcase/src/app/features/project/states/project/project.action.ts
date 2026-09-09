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

/**
 * Which project the screens are looking at, and `null` for all of them.
 *
 * The one action in this application with no effect behind it — choosing is a
 * decision, not a request, and nothing has to be asked of the server to make
 * it true. It travels as an action all the same, so it shows up in the history
 * beside the reads it changes the meaning of.
 */
export const projectSelected = defineSingleAction(
  'PROJECT_SELECTED',
  payload<string | null>(),
);

export const projectReset = defineSingleAction('PROJECT_RESET', emptyPayload);
