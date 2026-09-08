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

    this.taskManager.update(this.updateTask(newStatus, event));
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
