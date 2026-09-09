import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { Task } from '../../models';
import {
  KanbanComponent,
  type KanbanColumn,
  type KanbanMove,
  type KanbanReorder,
} from '@shared/ui/kanban';
import { TaskBoardService, TaskSelectionService } from '../../services';
import { ProjectManager } from '@app/features/project/states/project/project.manager';

@Component({
  selector: 'app-task-kanban',
  imports: [KanbanComponent, MatCardModule, MatExpansionModule],
  templateUrl: './task-kanban.component.html',
  styleUrl: './task-kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskKanbanComponent {
  public tasks = input.required<Task[]>();
  public taskChanged = output<Task>();

  public readonly projectManager = inject(ProjectManager);
  private readonly board = inject(TaskBoardService);
  private readonly selection = inject(TaskSelectionService);

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
    `${task.title}, ${task.status}. Use the left and right arrow keys to move it between columns.`;

  /** One board per project, so the columns are built per project too. */
  public columnsOf(projectId: string): readonly KanbanColumn<Task>[] {
    const tasks = this.selection.ofProject(this.orderedTasks(), projectId);

    return this.board.columns.map((status) => ({
      id: status,
      label: status,
      items: this.selection.inStatus(tasks, status),
    }));
  }

  public onTaskMoved({ item, to }: KanbanMove<Task>): void {
    const status = this.board.asColumn(to);

    if (status) {
      this.taskChanged.emit(this.board.inColumn(item, status));
    }
  }

  /**
   * A reorder rearranges one column and nothing else, so walk the shown tasks
   * and hand back that column's tasks in their new order as their slots come
   * up. The tasks of the other projects keep their place.
   */
  public onColumnReordered({ items }: KanbanReorder<Task>): void {
    const reordered = [...items];
    const moved = new Set(reordered.map((task) => task.id));

    this.orderedTasks.update((tasks) =>
      tasks.map((task) =>
        moved.has(task.id) ? (reordered.shift() ?? task) : task,
      ),
    );
  }
}
