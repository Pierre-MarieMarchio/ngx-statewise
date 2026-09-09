import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { TaskCardBodyComponent } from '../task-card-body/task-card-body.component';
import { Task } from '../../models';
import {
  KanbanComponent,
  type KanbanColumn,
  type KanbanMove,
  type KanbanReorder,
} from '@shared/ui/kanban';
import {
  TaskBoardService,
  TaskPresentationService,
  TaskSelectionService,
} from '../../services';

/**
 * The board of whatever tasks it is handed.
 *
 * It used to draw one board per project inside an accordion, which meant five
 * boards stacked down the page, each folded shut, none of them wide enough to
 * be worth dragging on. Choosing a project is the page's job now, so what is
 * left here is one board — and it takes the whole width.
 */
@Component({
  selector: 'app-task-kanban',
  imports: [KanbanComponent, TaskCardBodyComponent],
  templateUrl: './task-kanban.component.html',
  styleUrl: './task-kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskKanbanComponent {
  public tasks = input.required<Task[]>();
  public taskChanged = output<Task>();

  private readonly board = inject(TaskBoardService);
  private readonly selection = inject(TaskSelectionService);
  private readonly presentation = inject(TaskPresentationService);

  /**
   * The order the board shows. Reordering inside one column is presentation
   * only — it has no counterpart on the server — so it lives here rather than
   * in the state, and `linkedSignal` drops it whenever the tasks themselves
   * change. Moving a card between columns goes through the manager instead,
   * and the updater applies it optimistically.
   */
  private readonly orderedTasks = linkedSignal(() => this.tasks());

  public readonly cardTypeFor = (task: Task): string => task.priority;

  public readonly labelFor = (task: Task): string =>
    `${task.title}, ${task.status}. Use the left and right arrow keys to move it between columns, and the up and down arrow keys to reorder it.`;

  /**
   * Built once per change rather than once per column per change detection.
   * Called from the template, this handed `KanbanComponent` a fresh array
   * every cycle, so its `columns` input always looked modified and an OnPush
   * component reconciled its whole body for nothing.
   */
  public readonly columns = computed<readonly KanbanColumn<Task>[]>(() =>
    this.board.columns.map((status) => ({
      id: status,
      // Spelled for a reader rather than shown as the key it is stored under.
      label: this.presentation.statusLabel(status),
      items: this.selection.inStatus(this.orderedTasks(), status),
    })),
  );

  public onTaskMoved({ item, to }: KanbanMove<Task>): void {
    const status = this.board.asColumn(to);

    if (status) {
      this.taskChanged.emit(this.board.inColumn(item, status));
    }
  }

  public onColumnReordered({ items }: KanbanReorder<Task>): void {
    this.orderedTasks.update((tasks) => this.board.reordered(tasks, items));
  }
}
