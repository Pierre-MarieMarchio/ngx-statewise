import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { AUTH_MANAGER, PROJECT_MANAGER } from '@shared/app-common/tokens';
import { TaskListColumnItem } from '../../models';
import { TaskSelectionService } from '../../services';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { Task } from '@shared/app-common/models';

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

  public projectManager = inject(PROJECT_MANAGER);
  private readonly selection = inject(TaskSelectionService);
  private readonly authManager = inject(AUTH_MANAGER);

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
      maxWidth: '200px',
    },
    {
      columnDef: 'priority',
      header: 'Priority',
      cell: (element: Task) => `${element.priority}`,
      maxWidth: '200px',
    },
    {
      columnDef: 'organisation',
      header: 'Organisation',
      cell: (element: Task) => `${element.organizationId}`,
      maxWidth: '200px',
      requiredRole: 'admin',
    },
  ];

  public selectTask(task: Task) {
    this.taskSelected.emit(task);
  }

  public getFilteredTasks(projectId: string): Task[] {
    return this.selection.ofProject(this.tasks(), projectId);
  }
}
