import { defineUpdater } from 'ngx-statewise';
import { NoticeState } from './notice.state';
import { noticeActions } from './notice.action';

/**
 * Registered through `provideStatewise({ updaters })` rather than by a
 * manager, so any handle reaches it, `injectStatewise()` with no updater at
 * all included. No manager claims NOTICE_RAISED or NOTICE_CLEARED, which is
 * the condition for a global updater to answer: a scoped updater would shadow
 * it for those types.
 */
export const noticeUpdater = defineUpdater(NoticeState, (on) => {
  on(noticeActions.raised, (state, message) => {
    state.message.set(message);
    state.raisedCount.update((count) => count + 1);
  });

  on(noticeActions.cleared, (state) => {
    state.message.set(null);
  });
});
