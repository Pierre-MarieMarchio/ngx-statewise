import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { TaskCardBodyComponent } from '../task-card-body/task-card-body.component';
import { Project, Task } from '../../models';
import {
  KanbanComponent,
  type KanbanColumn,
  type KanbanMove,
  type KanbanReorder,
} from '@shared/ui/kanban';
import { TaskBoardService, TaskSelectionService } from '../../services';
import { ProjectManager } from '@app/features/project/states/project/project.manager';

interface ProjectBoard {
  readonly project: Project;
  readonly columns: readonly KanbanColumn<Task>[];
}

@Component({
  selector: 'app-task-kanban',
  imports: [KanbanComponent, MatExpansionModule, TaskCardBodyComponent],
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
    `${task.title}, ${task.status}. Use the left and right arrow keys to move it between columns, and the up and down arrow keys to reorder it.`;

  /**
   * One board per project, built once per change rather than once per project
   * per change detection. Called from the template, this handed `KanbanComponent`
   * a fresh array every cycle, so its `columns` input always looked modified
   * and an OnPush component reconciled its whole body for nothing.
   */
  public readonly boards = computed<readonly ProjectBoard[]>(() =>
    this.projectManager.projects().map((project) => ({
      project,
      columns: this.columnsOf(project.id),
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

  private columnsOf(projectId: string): readonly KanbanColumn<Task>[] {
    const tasks = this.selection.ofProject(this.orderedTasks(), projectId);

    return this.board.columns.map((status) => ({
      id: status,
      label: status,
      items: this.selection.inStatus(tasks, status),
    }));
  }
}
