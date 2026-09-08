import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActionHistory, injectStatewise } from 'ngx-statewise';

import { CounterState, counterActions, counterUpdater } from './counter';

/**
 * A component wired the way a consumer wires one. Built ahead of time with
 * `strictTemplates`, so the signal the library's updater writes to has to
 * type-check inside the template too.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p id="value">{{ counter.value() }}</p>
    <p id="dispatched">{{ history.snapshot().length }}</p>
    <button type="button" (click)="increment()">increment</button>
  `,
})
export class AppComponent {
  protected readonly counter = inject(CounterState);
  protected readonly history = inject(ActionHistory);

  private readonly statewise = injectStatewise(counterUpdater);

  protected increment(): void {
    this.statewise.dispatch(counterActions.incremented(1));
  }
}
