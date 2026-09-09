import {
  Component,
  inject,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Task } from '../../models';
import { TaskColumnsService } from '../../services';

@Component({
  selector: 'app-all-task-list',
  imports: [MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './all-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './all-task-list.component.scss',
})
export class AllTaskListComponent {
  private readonly taskColumns = inject(TaskColumnsService);
  public tasks = input.required<Task[]>();
  public taskSelected = output<Task>();

  public readonly columns = this.taskColumns.columns;
  public readonly displayedColumns = this.taskColumns.displayedColumns;

  selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
