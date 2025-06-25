import { Component, inject, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Task } from '@shared/app-common/models';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import { DynamicTableColumnsService } from '@shared/app-common/services';
import { TASK_TABLE_COLUMNS } from '@shared/app-common/configs';

@Component({
  selector: 'app-all-task-list',
  imports: [MatTableModule],
  templateUrl: './all-task-list.component.html',
  styleUrl: './all-task-list.component.scss',
})
export class AllTaskListComponent {
  public tasks = input<Task[]>();
  public taskSelected = output<Task>();

  private readonly authManager = inject(AUTH_MANAGER);
  private readonly tableColumnsService = inject(DynamicTableColumnsService);

  public readonly allColumns = TASK_TABLE_COLUMNS;
  public readonly displayedColumns =
    this.tableColumnsService.getDisplayedColumns(
      this.allColumns,
      this.authManager.user
    );
  public readonly columnKeys = this.tableColumnsService.getColumnKeys(
    this.displayedColumns
  );

  selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
