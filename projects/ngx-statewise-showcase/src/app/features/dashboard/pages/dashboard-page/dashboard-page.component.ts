import { Component, signal, ViewChild } from '@angular/core';
import {
  DashboardKanbanComponent,
  DashboardTaskListComponent,
} from '../../components';
import { SidePanelComponent } from '@app/core/layouts';
import { Task } from '@shared/app-common/models';
import { TaskDetailsComponent } from '@shared/app-common/components';
import { DashboardUserPickerComponent } from '../../components/dashboard-user-picker/dashboard-user-picker.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DashboardKanbanComponent,
    SidePanelComponent,
    TaskDetailsComponent,
    DashboardTaskListComponent,
    DashboardUserPickerComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  host: {
    class: 'page',
  },
})
export class DashboardPageComponent {
  @ViewChild('dashboardPanel') dashboardPanel!: SidePanelComponent;

  public selectedTask = signal<Task | null>(null);

  public selectTask(task: Task): void {
    this.selectedTask.set(task);
    this.dashboardPanel.open();
  }
  public closeSideNav(): void {
    this.dashboardPanel.close();
  }
}
