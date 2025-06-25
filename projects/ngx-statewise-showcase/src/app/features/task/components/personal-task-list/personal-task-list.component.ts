import { Component, inject, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import { Task } from '@shared/app-common/models';
import { DynamicTableColumnsService } from '@shared/app-common/services';
import { TASK_TABLE_COLUMNS } from '@shared/app-common/configs';
import { TaskFilterService } from '../../services';

@Component({
  selector: 'app-personal-task-list',
  imports: [MatTableModule],
  templateUrl: './personal-task-list.component.html',
  styleUrl: './personal-task-list.component.scss',
})
export class PersonalTaskListComponent {
  public allTasks = input.required<Task[]>();
  public taskSelected = output<Task>();

  private readonly authManager = inject(AUTH_MANAGER);
  private readonly tableColumnsService = inject(DynamicTableColumnsService);
  private readonly taskFilterService = inject(TaskFilterService);

  public readonly allColumns = TASK_TABLE_COLUMNS;
  public readonly displayedColumns =
    this.tableColumnsService.getDisplayedColumns(
      this.allColumns,
      this.authManager.user
    );
  public readonly columnKeys = this.tableColumnsService.getColumnKeys(
    this.displayedColumns
  );

  public tasks = this.taskFilterService.getPersonalTasks(
    this.allTasks,
    this.authManager.user
  );

  selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
