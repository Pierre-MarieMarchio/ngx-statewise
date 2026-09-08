import { defineActionsGroup, emptyPayload, payload } from 'ngx-statewise';

export const tallyActions = defineActionsGroup({
  source: 'TALLY',
  events: {
    incremented: payload<number>(),
    reset: emptyPayload,
  },
});
