import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * A small labelled mark: an icon, a word, and a tint behind them.
 *
 * The markup of one lived in three places. The details panel drew coloured
 * `mat-chip`s, the tables printed the same values as grey lowercase text, and
 * a card drew a 4 px stripe with no legend at all. Three renderings of one
 * idea, and only one of them said what it meant.
 *
 * It knows nothing of tasks: what a status is called and what colour it takes
 * are the domain's, handed in by the badges in `features/project` that wrap
 * this.
 */
@Component({
  selector: 'app-chip',
  imports: [MatIconModule],
  template: `
    <span class="chip" [style.background-color]="tint()">
      @if (icon()) {
        <mat-icon class="chip-icon" aria-hidden="true">{{ icon() }}</mat-icon>
      }
      <span class="chip-label">{{ label() }}</span>
    </span>
  `,
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  public readonly label = input.required<string>();
  public readonly icon = input('');

  /** The colour behind it, as a CSS value. The caller owns the meaning. */
  public readonly tint = input('transparent');
}
