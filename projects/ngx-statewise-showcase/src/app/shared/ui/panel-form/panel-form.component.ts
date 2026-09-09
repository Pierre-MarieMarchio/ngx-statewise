import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * The shell every form in the side panel wears: a heading, the fields, what
 * the server said when it refused, and one row of actions.
 *
 * The two creation forms wrote all of that twice under two prefixes — four
 * identical SCSS rules each, the same `role="alert"` paragraph, the same
 * Cancel-and-submit row — and only their fields differed. Editing a task and
 * editing a project add two more callers, so the shell earns its place before
 * they arrive rather than after.
 *
 * It does not own the `<form>` element. The fields are projected, so their
 * `formControlName` has to resolve against a `formGroup` in the caller's own
 * template; the submit button only needs to be a descendant of it, which it
 * is. That is why the caller keeps the `<form>` and puts this inside it.
 */
@Component({
  selector: 'app-panel-form',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './panel-form.component.html',
  styleUrl: './panel-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelFormComponent {
  public readonly heading = input.required<string>();

  /** What the submit button says, and what it says while it is waiting. */
  public readonly submitLabel = input.required<string>();
  public readonly pendingLabel = input('Working…');

  /** True while the request is on its way, so a second submit is refused. */
  public readonly pending = input(false);

  /**
   * What the server said when it refused. Shown as it came: the form cannot
   * know that a title is taken, and only the server can name which one.
   */
  public readonly refusal = input<string | null>(null);

  public readonly cancelled = output<void>();
}
