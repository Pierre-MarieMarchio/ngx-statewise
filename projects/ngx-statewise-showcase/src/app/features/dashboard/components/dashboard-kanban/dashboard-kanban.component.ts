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
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import {
  TaskBoardService,
  TaskSelectionService,
} from '@app/features/project/services';
import { KanbanCardComponent } from '@shared/app-common/components';
import { Task } from '@shared/app-common/models';
import { TASK_MANAGER } from '@shared/app-common/tokens';

@Component({
  selector: 'app-dashboard-kanban',
  imports: [
    CdkDropList,
    KanbanCardComponent,
    MatGridListModule,
    MatCardModule,
    MatExpansionModule,
  ],
  templateUrl: './dashboard-kanban.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dashboard-kanban.component.scss',
})
export class DashboardKanbanComponent {
  private readonly taskManager = inject(TASK_MANAGER);
  private readonly board = inject(TaskBoardService);
  private readonly selection = inject(TaskSelectionService);
  private readonly errorHandler = inject(ErrorHandler);

  /**
   * Read straight from the manager: the board shows the state, and the state
   * already carries the optimistic move. Nothing is copied here, so nothing
   * has to be rolled back here either.
   */
  public tasks = this.taskManager.tasks;

  /** Nothing to lay out on a board, so the board says so instead. */
  public readonly isEmpty = computed(() => (this.tasks() ?? []).length === 0);

  public readonly columns = computed(() =>
    this.board.columns.map((status) => ({
      id: status,
      tasks: this.selection.inStatus(this.tasks(), status),
    })),
  );

  public onTaskDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      return;
    }

    this.dropInto(event);
  }

  /** Keyboard path: the CDK provides none, and this board is the main demo. */
  public moveTask(task: Task, offset: number): void {
    const moved = this.board.movedBy(task, offset);

    if (moved) {
      this.taskManager.update(moved);
    }
  }

  /** What a screen reader reads on a card, and how to move it. */
  public cardLabel(task: Task): string {
    return `${task.title}, ${task.status}. Use the left and right arrow keys to move it between columns.`;
  }

  public getConnectedDropListIds(): string[] {
    return this.board.connectedDropListIds();
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

    this.taskManager.update(moved);
  }
}
