import {
  ChangeDetectionStrategy,
  Component,
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

  public selectedTask = signal<Task | null>(null);

  /** Whether the panel is open, which is the panel's own `model`. */
  public readonly panelOpen = signal(false);

  public selectTask(task: Task): void {
    this.selectedTask.set(task);
    this.panelOpen.set(true);
  }

  public closeSideNav(): void {
    this.panelOpen.set(false);
  }
}
