import {
  ChangeDetectionStrategy,
  Component,
  inject,
  NgZone,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { injectStatewise } from 'ngx-statewise';
import { TallyState } from '../../states/tally/tally.state';
import { tallyActions } from '../../states/tally/tally.action';
import { tallyUpdater } from '../../states/tally/tally.updater';

/** How long the deferred dispatch waits, long enough to watch the view lag. */
export const DEFERRED_DISPATCH_DELAY_MS = 800;

/**
 * The tally state holds plain properties, so the numbers below are read at
 * render time rather than observed. Clicking a button refreshes them because
 * the click itself runs change detection. The deferred button dispatches from
 * a timer started outside Angular, where no event follows to redraw anything:
 * the state moves and the view does not, until it is asked to. A signal would
 * have taken care of that.
 */
@Component({
  selector: 'app-tally-demo',
  imports: [MatButtonModule],
  templateUrl: './tally-demo.component.html',
  styleUrl: './tally-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TallyDemoComponent {
  public readonly tallyState = inject(TallyState);

  private readonly statewise = injectStatewise(tallyUpdater);
  private readonly zone = inject(NgZone);

  public increment(step: number): void {
    this.statewise.dispatch(tallyActions.incremented(step));
  }

  /**
   * Both the timer and the dispatch it runs stay outside Angular, so nothing
   * schedules change detection when the state changes.
   */
  public incrementLater(step: number): void {
    this.zone.runOutsideAngular(() => {
      setTimeout(() => {
        this.statewise.dispatch(tallyActions.incremented(step));
      }, DEFERRED_DISPATCH_DELAY_MS);
    });
  }

  /** Any click redraws the component; this one does nothing else. */
  public redraw(): void {
    return undefined;
  }

  public reset(): void {
    this.statewise.dispatch(tallyActions.reset());
  }
}
