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
import { KanbanCardComponent } from '@shared/app-common/components';
import { STATUSES, Task, TaskStatus } from '@shared/app-common/models';
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
  private readonly errorHandler = inject(ErrorHandler);

  private readonly statuses = STATUSES;

  /**
   * Read straight from the manager: the board shows the state, and the state
   * already carries the optimistic move. Nothing is copied here, so nothing
   * has to be rolled back here either.
   */
  public tasks = this.taskManager.tasks;

  /** Nothing to lay out on a board, so the board says so instead. */
  public readonly isEmpty = computed(() => (this.tasks() ?? []).length === 0);

  public readonly columns = computed(() =>
    this.statuses.map((status) => ({
      id: status,
      tasks: (this.tasks() ?? []).filter((task) => task.status === status),
    })),
  );

  /**
   * The keyboard path the CDK does not provide. Dragging is the only way a
   * mouse has, and it was the only way at all: a card was a `cdkDrag` with no
   * tabindex and no key handler, which made the showcase's main interaction
   * unusable without a pointer.
   */
  public moveTask(task: Task, offset: number): void {
    const from = this.statuses.indexOf(task.status);
    const to = from + offset;

    if (to < 0 || to >= this.statuses.length) {
      return;
    }

    this.applyMove({ ...task, status: this.statuses[to] });
  }

  /** What a screen reader reads on a card, and how to move it. */
  public cardLabel(task: Task): string {
    return `${task.title}, ${task.status}. Use the left and right arrow keys to move it between columns.`;
  }
  private applyMove(task: Task): void {
    this.taskManager.update(task);
  }

  public onTaskDrop(event: CdkDragDrop<Task[]>): void {
    const isSameContainer = event.previousContainer === event.container;

    if (isSameContainer) {
      this.handleSameColumnMove(event);
    } else {
      this.handleCrossColumnMove(event);
    }
  }

  private handleSameColumnMove(event: CdkDragDrop<Task[]>): void {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
  }

  private handleCrossColumnMove(event: CdkDragDrop<Task[]>): void {
    const id = event.container.id;
    const newStatus = id.slice('dropList_'.length);

    if (!this.statuses.includes(newStatus as TaskStatus)) {
      this.errorHandler.handleError(
        new Error(`invalid status detected: ${newStatus}`),
      );
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    this.applyMove(this.updateTask(newStatus, event));
  }

  private updateTask(
    newStatus: string,
    event: CdkDragDrop<Task[], Task[], Task>,
  ) {
    const movedTask = event.container.data[event.currentIndex];
    const updatedTask: Task = {
      ...movedTask,
      status: newStatus as TaskStatus,
    };

    event.container.data[event.currentIndex] = updatedTask;
    return updatedTask;
  }

  public getConnectedDropListIds() {
    return this.statuses.map((status) => `dropList_${status}`);
  }
}
