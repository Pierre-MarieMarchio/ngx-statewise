import {
  Component,
  computed,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Task } from '../../models';
import { AssignedTasksService, TaskColumnsService } from '../../services';

@Component({
  selector: 'app-personal-task-list',
  imports: [MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './personal-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './personal-task-list.component.scss',
})
export class PersonalTaskListComponent {
  public allTasks = input.required<Task[]>();
  public taskSelected = output<Task>();

  private readonly assigned = inject(AssignedTasksService);
  private readonly taskColumns = inject(TaskColumnsService);

  public tasks = computed(() => this.assigned.ofCurrentUser(this.allTasks()));

  public readonly columns = this.taskColumns.columns;
  public readonly displayedColumns = this.taskColumns.displayedColumns;

  selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
