import {
  Component,
  inject,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { TaskListColumnItem } from '@app/features/project/models';
import { Task } from '../../models';
import { AUTH_SESSION } from '@app/features/common';

@Component({
  selector: 'app-all-task-list',
  imports: [MatTableModule],
  templateUrl: './all-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './all-task-list.component.scss',
})
export class AllTaskListComponent {
  private readonly authManager = inject(AUTH_SESSION);
  public tasks = input<Task[]>();
  public taskSelected = output<Task>();

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
