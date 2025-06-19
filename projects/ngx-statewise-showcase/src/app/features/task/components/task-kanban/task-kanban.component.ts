import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Task } from '../../models';
import { STATUSES, TaskStatus } from '@shared/app-common/models';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { PROJECT_MANAGER, TASK_MANAGER } from '@shared/app-common/tokens';
import { KanbanCardComponent } from '@shared/app-common/components';


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

  private readonly taskManager = inject(TASK_MANAGER);
  public readonly projectManager = inject(PROJECT_MANAGER);
  private readonly statuses = STATUSES;
  private readonly localTasks = signal<Task[]>([]);
  private readonly pendingUpdates = signal<Map<string, Task>>(new Map());

  constructor() {
    effect(() => {
      const parentTasks = this.tasks();
      if (parentTasks) {
        const pending = this.pendingUpdates();
        const updatedTasks = parentTasks.map((task) =>
          pending.has(task.id) ? pending.get(task.id)! : task
        );
        this.localTasks.set([...updatedTasks]);
      }
    });

    effect(() => {
      if (this.taskManager.isError()) {
        console.error('Error detected, rolling back kanban state');
        this.pendingUpdates.set(new Map());
        const originalTasks = this.tasks();
        if (originalTasks) {
          this.localTasks.set([...originalTasks]);
        }
      }
    });

    effect(() => {
      const parentTasks = this.tasks();
      const pending = this.pendingUpdates();

      if (parentTasks && pending.size > 0) {
        const newPending = new Map(pending);
        let hasChanges = false;

        pending.forEach((pendingTask, taskId) => {
          const parentTask = parentTasks.find((t) => t.id === taskId);
          if (parentTask && parentTask.status === pendingTask.status) {
            newPending.delete(taskId);
            hasChanges = true;
          }
        });

        if (hasChanges) {
          this.pendingUpdates.set(newPending);
        }
      }
    });
  }

  public readonly columns = computed(() =>
    this.statuses.map((status) => ({
      id: status,
      tasks: this.localTasks()?.filter((t) => t.status === status),
    }))
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
      event.currentIndex
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
      event.currentIndex
    );

    const movedTask = event.container.data[event.currentIndex];
    const updatedTask: Task = {
      ...movedTask,
      status: newStatus as TaskStatus,
    };

    event.container.data[event.currentIndex] = updatedTask;

    const currentPending = this.pendingUpdates();
    const newPending = new Map(currentPending);
    newPending.set(updatedTask.id, updatedTask);
    this.pendingUpdates.set(newPending);

    this.taskChanged.emit(updatedTask);
  }

  public getProjectFilteredTasks(projectId: string, tasksToFilter: Task[]): Task[] {
    return tasksToFilter?.filter((task) => task.projectId === projectId) || [];
  }

  public getConnectedDropListIds(projectId: string) {
    return this.statuses.map((status) => `dropList_${status}_${projectId}`);
  }
}
