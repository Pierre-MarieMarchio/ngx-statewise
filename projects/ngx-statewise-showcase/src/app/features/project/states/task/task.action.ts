import { Task } from '../../models';
import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from 'ngx-statewise';

export const getAllTaskActions = defineActionsGroup({
  source: 'TASK',
  events: {
    request: emptyPayload,
    success: payload<Task[]>(),
    failure: emptyPayload,
  },
});

export const updateTaskActions = defineActionsGroup({
  source: 'UPDATE_TASK',
  events: {
    request: payload<Task>(),
    success: payload<Task>(),
    /**
     * The id of the task whose write failed. A failure has to say which card
     * it concerns: a payload-less one left the updater with a single flag for
     * every write in flight, and reverting on it took down the cards the
     * server had never refused.
     */
    failure: payload<string>(),
  },
});

export const taskReset = defineSingleAction('TASK_RESET', emptyPayload);
