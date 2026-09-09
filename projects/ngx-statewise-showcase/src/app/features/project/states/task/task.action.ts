import { Task, TaskDraft } from '../../models';
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

/** Pessimistic, and carrying the server's sentence — see createProjectActions. */
export const createTaskActions = defineActionsGroup({
  source: 'CREATE_TASK',
  events: {
    request: payload<TaskDraft>(),
    success: payload<Task>(),
    failure: payload<string>(),
  },
});

/**
 * A filtered search, asked of the server rather than computed here — which is
 * what makes it the case `concurrency: 'latest'` is for: two keystrokes put two
 * requests in flight, and only the last one's answer is wanted.
 */
export const searchTaskActions = defineActionsGroup({
  source: 'SEARCH_TASK',
  events: {
    request: payload<string>(),
    success: payload<Task[]>(),
    failure: emptyPayload,
  },
});

/** Emptying the box: there is no search any more, so no answer is wanted. */
export const searchCleared = defineSingleAction('SEARCH_CLEARED', emptyPayload);

export const taskReset = defineSingleAction('TASK_RESET', emptyPayload);
