import { TestBed } from '@angular/core/testing';
import { ɵPendingEffects } from 'ngx-statewise';

/**
 * Waits for every effect still running in the current `TestBed`, whichever
 * manager started it. Use it to let a fire-and-forget `dispatch` settle before
 * asserting.
 */
export function drainEffects(): Promise<void> {
  return TestBed.inject(ɵPendingEffects).waitForAll();
}
