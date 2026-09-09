import { ChangeDetectionStrategy, Component } from '@angular/core';

import { subject } from './subject';

/**
 * Renders whatever the variant produced, so the optimizer cannot drop it.
 *
 * A build that discarded the subject would measure an empty application three
 * times over and report that ngx-statewise weighs nothing.
 */
@Component({
  selector: 'app-root',
  template: '<p>{{ measured }}</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  public readonly measured = subject();
}
