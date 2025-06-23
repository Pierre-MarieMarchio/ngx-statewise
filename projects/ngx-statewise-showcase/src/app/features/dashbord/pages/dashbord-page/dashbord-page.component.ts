import { Component, inject, signal, ViewChild } from '@angular/core';
import { DashbordKanbanComponent, DashbordTaskListComponent } from '../../components';
import { SidePanelComponent } from '@app/core/layouts';
import { TASK_MANAGER } from '@shared/app-common/tokens';
import { Task } from '@shared/app-common/models';
import { TaskDetailsComponent } from '@shared/app-common/components';


@Component({
  selector: 'app-dashbord-page',
  imports: [DashbordKanbanComponent, SidePanelComponent, TaskDetailsComponent, DashbordTaskListComponent],
  templateUrl: './dashbord-page.component.html',
  styleUrl: './dashbord-page.component.scss',
  host: {
    class: 'page',
  },
})
export class DashbordPageComponent {
  @ViewChild('taskPanel') dashbordPanel!: SidePanelComponent;

  public readonly taskManager = inject(TASK_MANAGER);

  public selectedTask = signal<Task | null>(null);

  public selectTask(task: Task): void {
    this.selectedTask.set(task);
    this.dashbordPanel.open();
  }
  public closeSideNav(): void {
    this.dashbordPanel.close();
  }
}
