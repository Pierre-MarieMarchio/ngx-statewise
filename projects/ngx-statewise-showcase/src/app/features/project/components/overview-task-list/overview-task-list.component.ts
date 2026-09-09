import {
  Component,
  inject,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Task } from '../../models';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { TaskOpenColumnComponent } from '../task-open-column/task-open-column.component';
import { TaskColumnsService } from '../../services';
import { TaskManager } from '@app/features/project/states/task/task.manager';

@Component({
  selector: 'app-overview-task-list',
  imports: [MatTableModule, MatCardModule, TaskOpenColumnComponent],
  templateUrl: './overview-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './overview-task-list.component.scss',
})
export class OverviewTaskListComponent {
  public taskSelected = output<Task>();

  private readonly taskColumns = inject(TaskColumnsService);
  private readonly taskManager = inject(TaskManager);

  public tasks = this.taskManager.tasks;
  public readonly columns = this.taskColumns.columns;
  public readonly displayedColumns = this.taskColumns.displayedColumns;

  selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
