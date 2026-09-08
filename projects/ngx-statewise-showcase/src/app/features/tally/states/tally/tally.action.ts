import { defineActionsGroup, emptyPayload, payload } from 'ngx-statewise';

export const tallyActions = defineActionsGroup({
  source: 'Tally',
  events: {
    incremented: payload<number>(),
    reset: emptyPayload,
  },
});
