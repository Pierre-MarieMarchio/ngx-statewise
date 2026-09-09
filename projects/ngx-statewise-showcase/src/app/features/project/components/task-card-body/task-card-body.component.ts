import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Task } from '../../models';

/**
 * What a task looks like on a board card.
 *
 * The two boards wrote the same header-and-content block into their own
 * `#kanbanCard` template, word for word. Every field a card is due to gain —
 * the priority, the due date, the assignee — would have been the same addition
 * written twice, in two files, which is exactly the shape that put the
 * duplication ratio at 19.6% once before.
 *
 * It stays in `features/project` because it knows what a `Task` is. The board
 * in `shared/ui` goes on knowing nothing about it, which is its whole point.
 */
@Component({
  selector: 'app-task-card-body',
  imports: [MatCardModule],
  templateUrl: './task-card-body.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardBodyComponent {
  public readonly task = input.required<Task>();
}
