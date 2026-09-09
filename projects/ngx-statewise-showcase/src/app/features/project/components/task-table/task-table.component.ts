import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { Task } from '../../models';
import { TaskColumnsService } from '../../services';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { TaskOpenColumnComponent } from '../task-open-column/task-open-column.component';
import { UserChipComponent } from '../user-chip/user-chip.component';

/**
 * A table of tasks — the one table of tasks in this application.
 *
 * Four templates used to write the same twenty-two lines: the loop over the
 * columns, the two `matColumnDef` cells, the action column and the two row
 * definitions. `TaskColumnsService` had already factored out *which* columns a
 * role may see; nothing had factored out the markup that renders them, and
 * copying a table into sibling components is what put the duplication ratio at
 * 19.6% once before.
 *
 * What differs between the four callers is an input now: the tasks, whether
 * the columns are capped for an accordion, and what to say when there are
 * none.
 */
@Component({
  selector: 'app-task-table',
  imports: [
    MatTableModule,
    PriorityBadgeComponent,
    StatusBadgeComponent,
    TaskOpenColumnComponent,
    UserChipComponent,
  ],
  templateUrl: './task-table.component.html',
  styleUrl: './task-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTableComponent {
  private readonly taskColumns = inject(TaskColumnsService);

  public readonly tasks = input.required<readonly Task[]>();

  /**
   * Caps every column but the title. A board's table sits inside an accordion
   * and cannot spread; the title keeps the slack the others give up.
   */
  public readonly capped = input(false);

  /**
   * What stands in for the table when there is nothing to put in it. An
   * invitation rather than a report: "no task to show" tells a reader what
   * they can already see, and nothing about what to do next.
   */
  public readonly emptyMessage = input('No tasks yet. Create one to start.');

  public readonly taskSelected = output<Task>();

  public readonly columns = computed(() =>
    this.capped()
      ? this.taskColumns.cappedColumns()
      : this.taskColumns.columns(),
  );

  public readonly displayedColumns = this.taskColumns.displayedColumns;
}
