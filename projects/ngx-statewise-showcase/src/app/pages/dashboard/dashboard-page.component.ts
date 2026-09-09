import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SidePanelComponent } from '@shared/ui/side-panel';
import { Task } from '@app/features/project/models';
import { DataStateComponent } from '@shared/ui/data-state';
import {
  OverviewKanbanComponent,
  OverviewTaskListComponent,
  TaskDetailsComponent,
} from '@app/features/project/components';
import { UserPickerComponent } from '@app/features/auth/components';
import { TaskManager } from '@app/features/project/states/task/task.manager';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    OverviewKanbanComponent,
    DataStateComponent,
    SidePanelComponent,
    TaskDetailsComponent,
    OverviewTaskListComponent,
    UserPickerComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class DashboardPageComponent {
  public readonly taskManager = inject(TaskManager);

  private readonly selectedTaskId = signal<string | null>(null);

  /**
   * Derived rather than stored, like the board's: a card dragged on the
   * overview kanban used to leave the panel showing the version it had before.
   */
  public readonly selectedTask = computed<Task | null>(() => {
    const taskId = this.selectedTaskId();

    return taskId === null
      ? null
      : (this.taskManager.tasks().find((task) => task.id === taskId) ?? null);
  });

  /** Whether the panel is open, which is the panel's own `model`. */
  public readonly panelOpen = signal(false);

  public selectTask(task: Task): void {
    this.selectedTaskId.set(task.id);
    this.panelOpen.set(true);
  }

  public closeSideNav(): void {
    this.panelOpen.set(false);
  }
}
