import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Task } from '../../models';
import { STATUSES } from '@shared/app-common/models';
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

@Component({
  selector: 'app-task-kanban',
  imports: [
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './task-kanban.component.html',
  styleUrl: './task-kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskKanbanComponent {
  public tasks = input<Task[]>();
  public taskChanged = output<Task>()

  private readonly statuses = STATUSES;

  readonly columns = computed(() =>
    this.statuses.map((status) => ({
      id: status,
      tasks: this.tasks()?.filter((t) => t.status === status),
    }))
  );

  public getConnectedDropListIds(){
    return this.statuses.map((status) => `dropList-${status}`)
  }
}
