import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { AUTH_MANAGER, PROJECT_MANAGER } from '@shared/app-common/tokens';
import { Task } from '@shared/app-common/models';
import { DynamicTableColumnsService } from '@shared/app-common/services';
import { TASK_TABLE_COLUMNS } from '@shared/app-common/configs';

@Component({
  selector: 'app-project-task-list',
  imports: [MatExpansionModule, MatTableModule],
  templateUrl: './project-task-list.component.html',
  styleUrl: './project-task-list.component.scss',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTaskListComponent {
  public tasks = input<Task[]>();
  public taskSelected = output<Task>();

  private readonly projectManager = inject(PROJECT_MANAGER);
  private readonly authManager = inject(AUTH_MANAGER);
  private readonly tableColumnsService = inject(DynamicTableColumnsService);

  public readonly projects = this.projectManager.projects;
  public readonly allColumns = TASK_TABLE_COLUMNS;
  public readonly displayedColumns =
    this.tableColumnsService.getDisplayedColumns(
      this.allColumns,
      this.authManager.user
    );
  public readonly columnKeys = this.tableColumnsService.getColumnKeys(
    this.displayedColumns
  );

  public selectTask(task: Task) {
    this.taskSelected.emit(task);
  }

  public getFilteredTasks(projectId: string): Task[] {
    const tasksToFilter = this.tasks();
    return tasksToFilter?.filter((task) => task.projectId === projectId) || [];
  }
}
