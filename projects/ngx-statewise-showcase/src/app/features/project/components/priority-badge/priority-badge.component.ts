import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ChipComponent } from '@shared/ui/chip';
import { TaskPriority } from '../../models';
import { TaskPresentationService } from '../../services';

/**
 * How urgent a task is, and the warm half of the two scales: sand, orange, red.
 *
 * The tint is taken at a quarter of the hue, like a status, so a row of both
 * reads as one family of marks with two temperatures rather than as two
 * unrelated things.
 */
@Component({
  selector: 'app-priority-badge',
  imports: [ChipComponent, TitleCasePipe],
  template: `
    <app-chip
      [icon]="presentation.priorityIcon(priority())"
      [label]="priority() | titlecase"
      [tint]="
        'color-mix(in srgb, var(--priority-' +
        priority() +
        ') 25%, transparent)'
      "
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  public readonly priority = input.required<TaskPriority>();

  public readonly presentation = inject(TaskPresentationService);
}
