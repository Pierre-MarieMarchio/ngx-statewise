import { Component, inject, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Task, TaskListColumnItem } from '@app/features/task/models';
import { AUTH_MANAGER } from '@shared/app-common/tokens';

@Component({
  selector: 'app-all-task-list',
  imports: [MatTableModule],
  templateUrl: './all-task-list.component.html',
  styleUrl: './all-task-list.component.scss',
})
export class AllTaskListComponent {
  private readonly authManager = inject(AUTH_MANAGER);
  public tasks = input<Task[]>();
  public taskSelected = output<Task>();

  public columns: TaskListColumnItem[] = [];
  public displayedColumns: string[] = [];

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
