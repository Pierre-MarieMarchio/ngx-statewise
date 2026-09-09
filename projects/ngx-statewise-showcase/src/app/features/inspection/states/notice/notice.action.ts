import { defineActionsGroup, emptyPayload, payload } from 'ngx-statewise';

/**
 * Notices belong to no manager. Their types are claimed by the global updater
 * alone, which is what makes them reachable from any dispatch handle.
 */
export const noticeActions = defineActionsGroup({
  source: 'NOTICE',
  events: {
    raised: payload<string>(),
    cleared: emptyPayload,
  },
});
