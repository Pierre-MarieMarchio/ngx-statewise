import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';

/**
 * A panel that slides in over the view, holding whatever the caller puts in it.
 *
 * Whether it is open is a `model`, not three methods behind a `@ViewChild`.
 * The caller already keeps *what* the panel shows in a signal; it had to reach
 * into the component to say *whether* to show it — two mechanisms for one
 * panel, and a non-null assertion in each caller to make the query typecheck.
 *
 * One signal does both jobs, and it does one more: the drawer writes back when
 * the viewer closes it from the backdrop or with ESC, which the methods never
 * reported. A caller now knows the panel is shut without having asked.
 */
@Component({
  selector: 'app-side-panel',
  imports: [MatSidenavModule],
  templateUrl: './side-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './side-panel.component.scss',
})
export class SidePanelComponent {
  public readonly opened = model(false);
}
