import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { TaskManager } from '@app/features/project/states/task/task.manager';
import { SectionCardComponent } from '@shared/ui/section-card';
import { Task } from '../../models';
import { TaskTableComponent } from '../task-table/task-table.component';

/**
 * The dashboard's panel of every task, read straight from the manager.
 *
 * The table itself is `app-task-table`; what this adds is the panel around it
 * and the decision to show the whole list rather than a selection.
 */
@Component({
  selector: 'app-overview-task-list',
  imports: [SectionCardComponent, TaskTableComponent],
  templateUrl: './overview-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewTaskListComponent {
  public taskSelected = output<Task>();

  private readonly taskManager = inject(TaskManager);

  public tasks = this.taskManager.tasks;
}
