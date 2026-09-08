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
import { STATUSES, Task, TaskStatus } from '@shared/app-common/models';
import { PROJECT_MANAGER } from '@shared/app-common/tokens';

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
  private readonly errorHandler = inject(ErrorHandler);

  private readonly statuses = STATUSES;

  /**
   * The order the board shows. Reordering inside one column is presentation
   * only — it has no counterpart on the server — so it lives here rather than
   * in the state, and `linkedSignal` drops it whenever the tasks themselves
   * change. Moving a card between columns goes through the manager instead,
   * and the updater applies it optimistically.
   */
  private readonly orderedTasks = linkedSignal(() => this.tasks() ?? []);

  public readonly columns = computed(() =>
    this.statuses.map((status) => ({
      id: status,
      tasks: this.orderedTasks().filter((task) => task.status === status),
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
    const columnTasks = [...event.container.data];
    moveItemInArray(columnTasks, event.previousIndex, event.currentIndex);
    this.reorderShownTasks(columnTasks);
  }

  /**
   * The template hands CDK a freshly filtered array, so reordering it in place
   * would be thrown away on the next change detection pass. A reorder only
   * rearranges one column, so walk the shown tasks and hand back that column's
   * tasks in their new order as their slots come up.
   */
  private reorderShownTasks(columnTasks: Task[]): void {
    const columnIds = new Set(columnTasks.map((task) => task.id));
    const reordered = [...columnTasks];

    this.orderedTasks.update((tasks) =>
      tasks.map((task) =>
        columnIds.has(task.id) ? (reordered.shift() ?? task) : task,
      ),
    );
  }

  private handleCrossColumnMove(event: CdkDragDrop<Task[]>): void {
    const id = event.container.id;
    const newStatus = id.slice('dropList_'.length, id.lastIndexOf('_'));

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

    this.taskChanged.emit(this.updateTask(newStatus, event));
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

  public getProjectFilteredTasks(
    projectId: string,
    tasksToFilter: Task[],
  ): Task[] {
    return tasksToFilter?.filter((task) => task.projectId === projectId) || [];
  }

  public getConnectedDropListIds(projectId: string) {
    return this.statuses.map((status) => `dropList_${status}_${projectId}`);
  }
}
