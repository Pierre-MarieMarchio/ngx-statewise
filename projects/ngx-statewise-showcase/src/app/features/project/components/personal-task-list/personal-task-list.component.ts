import {
  Component,
  computed,
  inject,
  input,
  output,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TaskListColumnItem } from '../../models';
import { MatTableModule } from '@angular/material/table';
import { Task } from '../../models';
import { AssignedTasksService } from '../../services';

@Component({
  selector: 'app-personal-task-list',
  imports: [MatTableModule],
  templateUrl: './personal-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './personal-task-list.component.scss',
})
export class PersonalTaskListComponent implements OnInit {
  public allTasks = input.required<Task[]>();
  public taskSelected = output<Task>();
  private readonly assigned = inject(AssignedTasksService);

  public tasks = computed(() => this.assigned.ofCurrentUser(this.allTasks()));

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
