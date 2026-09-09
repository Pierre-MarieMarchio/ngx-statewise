import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Task } from '../../models';
import { TaskPresentationService } from '../../services';
import { TaskManager } from '../../states/task/task.manager';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { UserChipComponent } from '../user-chip/user-chip.component';

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
  imports: [MatCardModule, PriorityBadgeComponent, UserChipComponent],
  templateUrl: './task-card-body.component.html',
  styleUrl: './task-card-body.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardBodyComponent {
  public readonly task = input.required<Task>();

  public readonly presentation = inject(TaskPresentationService);
  private readonly taskManager = inject(TaskManager);

  /**
   * True while this card's own write is out.
   *
   * The one place the library's voice appears on a working screen: an
   * optimistic update shows before the server has agreed, and until now
   * nothing said which cards were still a promise. `isSaving` could only say
   * that something somewhere was.
   */
  public readonly saving = computed(() =>
    this.taskManager.writingIds().has(this.task().id),
  );

  public readonly overdue = computed(() =>
    this.presentation.isOverdue(this.task().dueDate, this.task().status),
  );
}
