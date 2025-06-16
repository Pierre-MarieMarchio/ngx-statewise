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
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { TASK_MANAGER } from '@shared/app-common/tokens';

@Component({
  selector: 'app-task-kanban',
  imports: [
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './task-kanban.component.html',
  styleUrl: './task-kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskKanbanComponent {
  public tasks = input<Task[]>();
  public taskChanged = output<Task>();

  private readonly taskManager = inject(TASK_MANAGER);
  private readonly statuses = STATUSES;
  private readonly localTasks = signal<Task[]>([]);

  constructor() {
    effect(() => {
      const parentTasks = this.tasks();
      if (parentTasks) {
        this.localTasks.set([...parentTasks]); 
      }
    });

    effect(() => {
      if (this.taskManager.isError()) {
        console.error('Error detected, rolling back kanban state');
        const originalTasks = this.tasks();
        if (originalTasks) {
          this.localTasks.set([...originalTasks]);
        }
      }
    });
  }

  readonly columns = computed(() =>
    this.statuses.map((status) => ({
      id: status,
      tasks: this.localTasks()?.filter((t) => t.status === status),
    }))
  );

  public getConnectedDropListIds() {
    return this.statuses.map((status) => `dropList-${status}`);
  }

  public onTaskDrop(event: CdkDragDrop<Task[]>): void {
    const isSameContainer = event.previousContainer === event.container;

    if (isSameContainer) this.handleSameColumnMove(event);

    this.handleCrossColumnMove(event);
  }

  private handleSameColumnMove(event: CdkDragDrop<Task[]>): void {
    moveItemInArray(
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  private handleCrossColumnMove(event: CdkDragDrop<Task[]>): void {
    const newStatus = event.container.id.replace('dropList-', '');

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
    const updatedTAsk: Task = {
      ...movedTask,
      status: newStatus as TaskStatus,
    };

    event.container.data[event.currentIndex] = updatedTAsk;
    this.taskChanged.emit(updatedTAsk);
  }
}
