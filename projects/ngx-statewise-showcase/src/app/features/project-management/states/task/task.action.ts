import { Task } from '@app/core/fake-api/db.data';
import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from 'ngx-statewise';

export const getAllTaskActions = defineActionsGroup({
  source: 'Task',
  events: {
    request: emptyPayload,
    success: payload<Task[]>(),
    failure: emptyPayload,
  },
});

export const taskReset = defineSingleAction('TASK_RESET', emptyPayload);
