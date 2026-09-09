import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PanelFormComponent } from '../panel-form';

/**
 * The panel that asks before something is destroyed.
 *
 * It wears the same shell as the forms beside it — `app-panel-form` — so a
 * question and a form look like the same panel doing two things rather than
 * two panels that nearly match. What it adds is the question, and the fact
 * that its one action is destructive.
 *
 * `FormsModule` is imported for a form with no controls in it: `(ngSubmit)`
 * exists only where a form directive does, and without one it is a listener on
 * an event nothing raises — so the button would have looked live and done
 * nothing at all.
 */
@Component({
  selector: 'app-confirm-panel',
  imports: [FormsModule, PanelFormComponent],
  template: `
    <form (ngSubmit)="confirmed.emit()">
      <app-panel-form
        [heading]="heading()"
        [submitLabel]="confirmLabel()"
        [pendingLabel]="pendingLabel()"
        [pending]="pending()"
        [refusal]="refusal()"
        (cancelled)="cancelled.emit()"
      >
        <p class="confirm-panel-question">{{ question() }}</p>
      </app-panel-form>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmPanelComponent {
  public readonly heading = input.required<string>();
  public readonly question = input.required<string>();
  public readonly confirmLabel = input.required<string>();
  public readonly pendingLabel = input('Working…');

  public readonly pending = input(false);

  /** What the server said when it refused, which is why this stays open. */
  public readonly refusal = input<string | null>(null);

  public readonly confirmed = output<void>();
  public readonly cancelled = output<void>();
}
