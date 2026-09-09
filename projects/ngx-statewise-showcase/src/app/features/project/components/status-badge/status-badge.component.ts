import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ChipComponent } from '@shared/ui/chip';
import { TaskStatus } from '../../models';
import { TaskPresentationService } from '../../services';

/**
 * How far along a task is, drawn the same way wherever it is read.
 *
 * The cold half of the two scales: grey, blue, green. A status and a priority
 * shared two literals before, so "in progress" and "medium priority" were the
 * same blue and a reader could not tell which of the two a colour meant.
 */
@Component({
  selector: 'app-status-badge',
  imports: [ChipComponent, TitleCasePipe],
  template: `
    <app-chip
      [icon]="presentation.statusIcon(status())"
      [label]="status() | titlecase"
      [tint]="'var(--status-' + status() + ')'"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  public readonly status = input.required<TaskStatus>();

  public readonly presentation = inject(TaskPresentationService);
}
