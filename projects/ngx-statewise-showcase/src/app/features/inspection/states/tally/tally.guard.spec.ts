import { TestBed } from '@angular/core/testing';
import { ActionHistory, injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';

import { tallyActions } from './tally.action';
import { TallyGuard, TALLY_CEILING } from './tally.guard';
import { TallyState } from './tally.state';
import { tallyUpdater } from './tally.updater';

describe('TallyGuard', () => {
  let statewise: Statewise;
  let tallyState: TallyState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting({ interceptors: [TallyGuard] })],
    });

    tallyState = TestBed.inject(TallyState);
    tallyState.total = 0;
    tallyState.lastStep = 0;

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(tallyUpdater),
    );
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('lets a step through while the ceiling is not reached', async () => {
    await statewise.dispatchAsync(tallyActions.incremented(5));

    expect(tallyState.total).toBe(5);
  });

  it('refuses the step that would carry the tally past the ceiling', async () => {
    await statewise.dispatchAsync(tallyActions.incremented(TALLY_CEILING));

    await statewise.dispatchAsync(tallyActions.incremented(1));

    expect(tallyState.total).toBe(TALLY_CEILING);
  });

  /**
   * What separates a refusal from an updater that clamps: a clamp records
   * something that did not happen, a refusal records nothing.
   */
  it('leaves no history entry for the step it refused', async () => {
    await statewise.dispatchAsync(tallyActions.incremented(TALLY_CEILING));
    await statewise.dispatchAsync(tallyActions.incremented(1));

    expect(
      TestBed.inject(ActionHistory)
        .snapshot()
        .map((entry) => entry.action.payload),
    ).toEqual([TALLY_CEILING]);
  });

  it('lets a step through again once the ceiling has room', async () => {
    await statewise.dispatchAsync(tallyActions.incremented(TALLY_CEILING));
    await statewise.dispatchAsync(tallyActions.reset());

    await statewise.dispatchAsync(tallyActions.incremented(1));

    expect(tallyState.total).toBe(1);
  });
});
