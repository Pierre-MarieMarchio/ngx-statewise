import { defineUpdater } from 'ngx-statewise';
import { demoLoginActions, demoResetAction } from './flow-demo.action';
import { FlowDemoState } from './flow-demo.state';

/**
 * The only place the demo's state changes, and every handler here is
 * synchronous — which is what lets the panel beside the diagram claim that the
 * state is settled before the effect starts.
 */
export const flowDemoUpdater = defineUpdater(FlowDemoState, (on) => {
  on(demoLoginActions.request, (state) => {
    state.isLoading.set(true);
    state.user.set(null);
    state.phase.set('pending');
    state.journal.update((journal) => [
      ...journal,
      { type: 'DEMO_LOGIN_REQUEST', returned: false },
    ]);
  });

  on(demoLoginActions.success, (state, session) => {
    state.isLoading.set(false);
    state.user.set(session.user);
    state.phase.set('done');
    state.journal.update((journal) => [
      ...journal,
      { type: 'DEMO_LOGIN_SUCCESS', returned: true },
    ]);
  });

  on(demoResetAction, (state) => {
    state.isLoading.set(false);
    state.user.set(null);
    state.phase.set('idle');
    state.journal.set([]);
  });
});
