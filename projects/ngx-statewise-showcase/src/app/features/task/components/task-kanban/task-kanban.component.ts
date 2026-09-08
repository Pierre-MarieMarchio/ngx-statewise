import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  OnDestroy,
} from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { STATUSES, Task, TaskStatus } from '@shared/app-common/models';
import { PROJECT_MANAGER, TASK_MANAGER } from '@shared/app-common/tokens';
import { KanbanCardComponent } from '@shared/app-common/components';
import {
  OptimisticStateUpdateService,
  StateRollbackService,
} from '@app/core/services';

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
export class TaskKanbanComponent implements OnDestroy {
  public tasks = input<Task[]>();
  public taskChanged = output<Task>();

  private readonly taskManager = inject(TASK_MANAGER);
  public readonly projectManager = inject(PROJECT_MANAGER);
  private readonly stateRollbackService = inject(StateRollbackService);
  private readonly optimisticStateService = inject(
    OptimisticStateUpdateService,
  );

  private readonly statuses = STATUSES;
  private readonly localTasks = signal<Task[]>([]);
  private readonly pendingUpdates = signal<Map<string, Task>>(new Map());
  private readonly destroyErrorRollback: () => void;
  private readonly destroyOptimisticTasksState: () => void;

  constructor() {
    this.destroyErrorRollback = this.stateRollbackService.setupErrorRollback({
      isError: () => this.taskManager.isError(),
      originalData: () => this.tasks(),
      localData: this.localTasks,
      pendingUpdates: this.pendingUpdates,
      errorMessage: 'Error detected, rolling back kanban state',
    });

    this.destroyOptimisticTasksState =
      this.optimisticStateService.setupOptimisticUpdates({
        sourceData: () => this.tasks(),
        pendingUpdates: this.pendingUpdates,
        localData: this.localTasks,
        getEntityId: (task) => task.id,
        isUpdateConfirmed: (sourceTask, pendingTask) =>
          sourceTask.status === pendingTask.status,
      });
  }

  ngOnDestroy() {
    this.destroyErrorRollback();
    this.destroyOptimisticTasksState();
  }

  public readonly columns = computed(() =>
    this.statuses.map((status) => ({
      id: status,
      tasks: this.localTasks()?.filter((t) => t.status === status),
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
    this.reorderLocalTasks(columnTasks);
  }

  /**
   * The template hands CDK a freshly filtered array, so reordering it in place
   * would be thrown away on the next change detection pass. A reorder only
   * rearranges one column, so walk the local tasks and hand back that column's
   * tasks in their new order as their slots come up.
   */
  private reorderLocalTasks(columnTasks: Task[]): void {
    const columnIds = new Set(columnTasks.map((task) => task.id));
    const reordered = [...columnTasks];

    this.localTasks.update((tasks) =>
      tasks.map((task) =>
        columnIds.has(task.id) ? (reordered.shift() ?? task) : task,
      ),
    );
  }

  private handleCrossColumnMove(event: CdkDragDrop<Task[]>): void {
    const id = event.container.id;
    const newStatus = id.slice('dropList_'.length, id.lastIndexOf('_'));

    if (!this.statuses.includes(newStatus as TaskStatus)) {
      console.warn(`invalid status detected: ${newStatus}`);
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );

    const updatedTask = this.updateTask(newStatus, event);

    const currentPending = this.pendingUpdates();
    const newPending = new Map(currentPending);
    newPending.set(updatedTask.id, updatedTask);
    this.pendingUpdates.set(newPending);

    this.taskChanged.emit(updatedTask);
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
