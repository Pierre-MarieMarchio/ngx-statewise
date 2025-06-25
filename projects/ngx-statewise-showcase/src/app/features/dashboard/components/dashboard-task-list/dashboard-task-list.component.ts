import { Component, computed, inject, output, Signal } from '@angular/core';
import { Task } from '@shared/app-common/models';
import { AUTH_MANAGER, TASK_MANAGER } from '@shared/app-common/tokens';
import { DashboardTaskListColumnItem } from '../../models';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dashboard-task-list',
  imports: [MatTableModule, MatCardModule],
  templateUrl: './dashboard-task-list.component.html',
  styleUrl: './dashboard-task-list.component.scss',
})
export class DashboardTaskListComponent {
  public taskSelected = output<Task>();

  private readonly authManager = inject(AUTH_MANAGER);
  private readonly taskManager = inject(TASK_MANAGER);

  private readonly user = this.authManager.user;
  public readonly tasks = this.taskManager.tasks;

  private readonly allColumns: DashboardTaskListColumnItem[] = [
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

  public readonly displayedColumns = computed(() =>
    this.allColumns.filter(
      (col) => !col.requiredRole || col.requiredRole === this.user()?.role
    )
  );

  public readonly columnKeys = computed(() =>
    this.displayedColumns().map((c) => c.columnDef)
  );

  selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
