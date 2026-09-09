import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TaskBoardService, TaskSelectionService } from '../../services';
import { Task } from '@shared/app-common/models';
import { TASK_MANAGER } from '@shared/app-common/tokens';
import {
  KanbanComponent,
  type KanbanColumn,
  type KanbanMove,
} from '@shared/ui/kanban';

@Component({
  selector: 'app-overview-kanban',
  imports: [KanbanComponent, MatCardModule],
  templateUrl: './overview-kanban.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './overview-kanban.component.scss',
})
export class OverviewKanbanComponent {
  private readonly taskManager = inject(TASK_MANAGER);
  private readonly board = inject(TaskBoardService);
  private readonly selection = inject(TaskSelectionService);

  /**
   * Read straight from the manager: the board shows the state, and the state
   * already carries the optimistic move. Nothing is copied here, so nothing
   * has to be rolled back here either.
   */
  public tasks = this.taskManager.tasks;

  /** Nothing to lay out on a board, so the card says so instead. */
  public readonly isEmpty = computed(() => (this.tasks() ?? []).length === 0);

  public readonly columns = computed<readonly KanbanColumn<Task>[]>(() =>
    this.board.columns.map((status) => ({
      id: status,
      label: status,
      items: this.selection.inStatus(this.tasks(), status),
    })),
  );

  public readonly cardTypeFor = (task: Task): string => task.priority;

  public readonly labelFor = (task: Task): string =>
    `${task.title}, ${task.status}. Use the left and right arrow keys to move it between columns.`;

  public onTaskMoved({ item, to }: KanbanMove<Task>): void {
    const status = this.board.asColumn(to);

    if (status) {
      this.taskManager.update(this.board.inColumn(item, status));
    }
  }
}
