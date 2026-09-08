import {
  Component,
  inject,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  DashboardKanbanComponent,
  DashboardTaskListComponent,
} from '../../components';
import { SidePanelComponent } from '@app/core/layouts';
import { Task } from '@shared/app-common/models';
import {
  DataStateComponent,
  TaskDetailsComponent,
} from '@shared/app-common/components';
import { TASK_MANAGER } from '@shared/app-common/tokens';
import { DashboardUserPickerComponent } from '../../components/dashboard-user-picker/dashboard-user-picker.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DashboardKanbanComponent,
    DataStateComponent,
    SidePanelComponent,
    TaskDetailsComponent,
    DashboardTaskListComponent,
    DashboardUserPickerComponent,
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

  public readonly taskManager = inject(TASK_MANAGER);

  public selectedTask = signal<Task | null>(null);

  public selectTask(task: Task): void {
    this.selectedTask.set(task);
    this.dashboardPanel.open();
  }
  public closeSideNav(): void {
    this.dashboardPanel.close();
  }
}
