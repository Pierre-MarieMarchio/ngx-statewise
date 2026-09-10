import { defineUpdater } from 'ngx-statewise';
import { TallyState } from './tally.state';
import { tallyActions } from './tally.action';

export const tallyUpdater = defineUpdater(TallyState, (on) => {
  on(tallyActions.incremented, (state, step) => {
    state.total += step;
    state.lastStep = step;
  });

  on(tallyActions.reset, (state) => {
    state.total = 0;
    state.lastStep = 0;
  });
});
