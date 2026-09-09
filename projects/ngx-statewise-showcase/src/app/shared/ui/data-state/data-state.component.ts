import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Renders what a manager reports about a read: that it is running, and that it
 * failed. Nothing when neither is true.
 *
 * It exists so that the views stop computing `isLoading` and `isError` and
 * throwing them away. One place holds the markup, the wording and the live
 * region, and each view says which manager it is reading.
 */
@Component({
  selector: 'app-data-state',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './data-state.component.html',
  styleUrl: './data-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataStateComponent {
  /** What is being read, named in the default wording. */
  public readonly label = input.required<string>();

  public readonly loading = input(false);
  public readonly error = input(false);

  /** Replaces the default sentence when the failure has a better wording. */
  public readonly errorMessage = input<string>();

  /** Whether the banner offers another try. */
  public readonly retryable = input(false);

  public readonly retried = output<void>();

  public readonly message = computed(
    () => this.errorMessage() ?? `The ${this.label()} could not be loaded.`,
  );
}
