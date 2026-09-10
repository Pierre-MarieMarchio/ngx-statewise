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
     * Which card the write was for, and what the server said about it.
     *
     * The id, because a failure has to say which card it concerns: a
     * payload-less one left the updater with a single flag for every write in
     * flight, and reverting on it took down the cards the server had never
     * refused. The reason, because "assign someone to this task before
     * marking it done" is a sentence only the server can write, and a banner
     * reading "the tasks could not be loaded" was answering a question
     * nobody had asked.
     */
    failure: payload<{ readonly taskId: string; readonly reason: string }>(),
  },
});

/** Pessimistic, and carrying the server's sentence. See createProjectActions. */
export const createTaskActions = defineActionsGroup({
  source: 'CREATE_TASK',
  events: {
    request: payload<TaskDraft>(),
    success: payload<Task>(),
    failure: payload<string>(),
  },
});

/**
 * A filtered search, asked of the server rather than computed here, which is
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

/**
 * Removing one. Pessimistic: a row taken off the screen before the server has
 * agreed is a row that has to reappear if it refuses, and reappear in its
 * place, which is more machinery than a delete is worth.
 *
 * It exists because deleting a project is refused while it still holds tasks.
 * A refusal with no way out is a dead end, and this is the way out.
 */
export const deleteTaskActions = defineActionsGroup({
  source: 'DELETE_TASK',
  events: {
    request: payload<string>(),
    success: payload<string>(),
    failure: payload<string>(),
  },
});

/** Emptying the box: there is no search any more, so no answer is wanted. */
export const searchCleared = defineSingleAction('SEARCH_CLEARED', emptyPayload);

export const taskReset = defineSingleAction('TASK_RESET', emptyPayload);
