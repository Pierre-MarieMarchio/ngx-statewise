import {
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ErrorHandler,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { KanbanCardComponent } from '@shared/app-common/components';
import { Task } from '@shared/app-common/models';
import { PROJECT_MANAGER } from '@shared/app-common/tokens';
import { TaskBoardService, TaskSelectionService } from '../../services';

@Component({
  selector: 'app-task-kanban',
  imports: [
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatExpansionModule,
    CdkDropList,
    KanbanCardComponent,
  ],
  templateUrl: './task-kanban.component.html',
  styleUrl: './task-kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskKanbanComponent {
  public tasks = input<Task[]>();
  public taskChanged = output<Task>();

  public readonly projectManager = inject(PROJECT_MANAGER);
  private readonly board = inject(TaskBoardService);
  private readonly selection = inject(TaskSelectionService);
  private readonly errorHandler = inject(ErrorHandler);

  /**
   * The order the board shows. Reordering inside one column is presentation
   * only — it has no counterpart on the server — so it lives here rather than
   * in the state, and `linkedSignal` drops it whenever the tasks themselves
   * change. Moving a card between columns goes through the manager instead,
   * and the updater applies it optimistically.
   */
  private readonly orderedTasks = linkedSignal(() => this.tasks() ?? []);

  public readonly columns = computed(() =>
    this.board.columns.map((status) => ({
      id: status,
      tasks: this.selection.inStatus(this.orderedTasks(), status),
    })),
  );

  public onTaskDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      this.reorderShownTasks(event);

      return;
    }

    this.dropInto(event);
  }

  /** Keyboard path: the CDK provides none, and this board is the main demo. */
  public moveTask(task: Task, offset: number): void {
    const moved = this.board.movedBy(task, offset);

    if (moved) {
      this.taskChanged.emit(moved);
    }
  }

  /** What a screen reader reads on a card, and how to move it. */
  public cardLabel(task: Task): string {
    return `${task.title}, ${task.status}. Use the left and right arrow keys to move it between columns.`;
  }

  public getProjectFilteredTasks(
    projectId: string,
    tasksToFilter: readonly Task[] | null | undefined,
  ): Task[] {
    return this.selection.ofProject(tasksToFilter, projectId);
  }

  public getConnectedDropListIds(projectId: string): string[] {
    return this.board.connectedDropListIds(projectId);
  }

  /**
   * The template hands CDK a freshly filtered array, so reordering it in place
   * would be thrown away on the next change detection pass. A reorder only
   * rearranges one column, so walk the shown tasks and hand back that column's
   * tasks in their new order as their slots come up.
   */
  private reorderShownTasks(event: CdkDragDrop<Task[]>): void {
    const columnTasks = [...event.container.data];
    moveItemInArray(columnTasks, event.previousIndex, event.currentIndex);

    const columnIds = new Set(columnTasks.map((task) => task.id));
    const reordered = [...columnTasks];

    this.orderedTasks.update((tasks) =>
      tasks.map((task) =>
        columnIds.has(task.id) ? (reordered.shift() ?? task) : task,
      ),
    );
  }

  private dropInto(event: CdkDragDrop<Task[]>): void {
    const column = this.board.columnOfDropList(event.container.id);

    if (column === null) {
      this.errorHandler.handleError(
        new Error(`invalid drop list id: ${event.container.id}`),
      );

      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const dropped = event.container.data[event.currentIndex];
    const moved = this.board.inColumn(dropped, column);

    // The array CDK mutated is what the template is iterating, so the card
    // has to carry its new column until the state answers.
    event.container.data[event.currentIndex] = moved;

    this.taskChanged.emit(moved);
  }
}
