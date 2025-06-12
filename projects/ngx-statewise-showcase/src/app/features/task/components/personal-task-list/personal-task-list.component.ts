import { Component, computed, inject, input, output } from '@angular/core';
import { Task, TaskListColumnItem } from '../../models';
import { MatTableModule } from '@angular/material/table';
import { AUTH_MANAGER } from '@shared/app-common/tokens';

@Component({
  selector: 'app-personal-task-list',
  imports: [MatTableModule],
  templateUrl: './personal-task-list.component.html',
  styleUrl: './personal-task-list.component.scss',
})
export class PersonalTaskListComponent {
  public allTasks = input<Task[]>();
  public taskSelected = output<Task>();
  private readonly authManager = inject(AUTH_MANAGER);

  public tasks = computed(() => {
    const tasks = this.allTasks() || [];
    const currentUser = this.authManager.user();
    const currentUserId = currentUser?.userId;

    if (!currentUserId || !tasks.length) {
      return [];
    }

    return tasks.filter((task) =>
      task.assignedUserIds?.includes(currentUserId)
    );
  });

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
  ];

  ngOnInit() {
    this.displayedColumns = this.columns.map((c) => c.columnDef);
  }

  selectTask(task: Task) {
    this.taskSelected.emit(task);
  }
}
