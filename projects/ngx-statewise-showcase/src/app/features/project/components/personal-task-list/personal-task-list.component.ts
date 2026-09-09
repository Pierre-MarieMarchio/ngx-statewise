import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Task } from '../../models';
import { AssignedTasksService } from '../../services';
import { TaskTableComponent } from '../task-table/task-table.component';

/**
 * The tasks assigned to whoever is signed in.
 *
 * What is left here after the table moved into `app-task-table` is the one
 * thing this view actually decides: what "mine" means, which is a question
 * about the session and lives in a service.
 */
@Component({
  selector: 'app-personal-task-list',
  imports: [TaskTableComponent],
  templateUrl: './personal-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalTaskListComponent {
  public allTasks = input.required<Task[]>();
  public taskSelected = output<Task>();

  private readonly assigned = inject(AssignedTasksService);

  public tasks = computed(() => this.assigned.ofCurrentUser(this.allTasks()));
}
