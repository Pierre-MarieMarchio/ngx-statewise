import { Component, inject, output } from '@angular/core';
import { Task } from '@shared/app-common/models';
import { AUTH_MANAGER, TASK_MANAGER } from '@shared/app-common/tokens';
import { DashbordTaskListColumnItem } from '../../models';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-dashbord-task-list',
  imports: [MatTableModule, MatCardModule],
  templateUrl: './dashbord-task-list.component.html',
  styleUrl: './dashbord-task-list.component.scss',
})
export class DashbordTaskListComponent {
  public taskSelected = output<Task>();

  private readonly authManager = inject(AUTH_MANAGER);
  private readonly taskManager = inject(TASK_MANAGER);

  public tasks = this.taskManager.tasks;
  public columns: DashbordTaskListColumnItem[] = [];
  public displayedColumns: string[] = [];

  private readonly allColumns: DashbordTaskListColumnItem[] = [
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

  ngOnInit() {
    this.columns = this.allColumns.filter(
      (col) =>
        !col.requiredRole || col.requiredRole === this.authManager.user()?.role
    );
    this.displayedColumns = this.columns.map((c) => c.columnDef);
  }

  selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
