import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Nothing but the outlet: the chrome lives in `ShellComponent`, which is
 * routed so it can read the locale its route provides.
 */
@Component({
  selector: 'docs-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
