import { inject, Injectable } from '@angular/core';
import { createInterceptor } from 'ngx-statewise';

import { tallyActions } from './tally.action';
import { TallyState } from './tally.state';

/** The most this tally is allowed to reach. Four presses of `+ 5`. */
export const TALLY_CEILING = 20;

/**
 * Where a refusal belongs: before the updater.
 *
 * A step that would carry the tally past its ceiling leaves no trace at all:
 * no state change, no effect, no history entry. That is what makes an
 * interceptor different from an updater that clamps. A clamp records something
 * that did not happen; a refusal records nothing.
 *
 * The class holds no effect, so it is declared under
 * `provideStatewise({ interceptors })` rather than under `effects`, which is
 * what that option exists for.
 */
@Injectable()
export class TallyGuard {
  private readonly tallyState = inject(TallyState);

  private readonly onIncrement = createInterceptor(
    tallyActions.incremented,
    (step) => this.tallyState.total + step <= TALLY_CEILING,
  );
}
