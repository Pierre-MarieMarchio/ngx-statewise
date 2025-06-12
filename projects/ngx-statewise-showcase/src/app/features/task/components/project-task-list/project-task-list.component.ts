import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { PROJECT_MANAGER } from '@shared/app-common/tokens';
import { Task, TaskListColumnItem } from '../../models';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';

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

  public displayedColumns: string[] = [];
  public readonly columns: TaskListColumnItem[] = [
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

  public ngOnInit() {
    this.displayedColumns = this.columns.map((c) => c.columnDef);
  }

  public selectTask(task: Task) {
    this.taskSelected.emit(task);
  }

  public getFilteredTasks(projectId: string): Task[] {
    const tasksToFilter = this.tasks();
    return tasksToFilter?.filter((task) => task.projectId === projectId) || [];
  }
}
