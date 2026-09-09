import {
  Component,
  inject,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Task } from '@shared/app-common/models';
import { AUTH_MANAGER, TASK_MANAGER } from '@shared/app-common/tokens';
import { TaskListColumnItem } from '../../models';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-overview-task-list',
  imports: [MatTableModule, MatCardModule],
  templateUrl: './overview-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './overview-task-list.component.scss',
})
export class OverviewTaskListComponent {
  public taskSelected = output<Task>();

  private readonly authManager = inject(AUTH_MANAGER);
  private readonly taskManager = inject(TASK_MANAGER);

  public tasks = this.taskManager.tasks;
  public readonly columns = computed(() =>
    this.allColumns.filter(
      (col) =>
        !col.requiredRole || col.requiredRole === this.authManager.user()?.role,
    ),
  );
  public readonly displayedColumns = computed(() =>
    this.columns().map((col) => col.columnDef),
  );

  private readonly allColumns: TaskListColumnItem[] = [
    {
      columnDef: 'title',
      header: 'Title',
      cell: (element: Task) => `${element.title}`,
    },
    {
      columnDef: 'status',
      header: 'Status',
      cell: (element: Task) => `${element.status}`,
    },
    {
      columnDef: 'priority',
      header: 'Priority',
      cell: (element: Task) => `${element.priority}`,
    },
    {
      columnDef: 'organisation',
      header: 'Organisation',
      cell: (element: Task) => `${element.organizationId}`,
      requiredRole: 'admin',
    },
  ];

  selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
