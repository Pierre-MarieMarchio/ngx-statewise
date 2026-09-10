import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

/**
 * A titled panel on a dashboard, holding whatever the caller puts in it.
 *
 * The two panels of `/home` had the same shell in two sheets, to three
 * declarations: a transparent card laid out as a column, a coloured title
 * band, a minimum height and a body that scrolls. Which also means the band,
 * painted in a hue that already means three other things, now has one place
 * to be redrawn rather than two.
 */
@Component({
  selector: 'app-section-card',
  imports: [MatCardModule],
  templateUrl: './section-card.component.html',
  styleUrl: './section-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionCardComponent {
  public readonly heading = input.required<string>();
}
