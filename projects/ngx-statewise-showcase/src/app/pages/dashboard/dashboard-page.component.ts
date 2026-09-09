import {
  Component,
  inject,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
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
  @ViewChild('dashboardPanel') dashboardPanel!: SidePanelComponent;

  public readonly taskManager = inject(TaskManager);

  public selectedTask = signal<Task | null>(null);

  public selectTask(task: Task): void {
    this.selectedTask.set(task);
    this.dashboardPanel.open();
  }
  public closeSideNav(): void {
    this.dashboardPanel.close();
  }
}
