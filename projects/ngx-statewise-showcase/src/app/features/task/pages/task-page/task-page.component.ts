import { Component, inject, signal, ViewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { SidePanelComponent } from '@app/core/layouts/side-panel/side-panel.component';
import { TaskManager } from '../../states'
import { TaskDetailsComponent, AllTaskListComponent, PersonalTaskListComponent } from '../../components';
import { Task } from '../../models';
import { ProjectTaskListComponent } from "../../components/project-task-list/project-task-list.component";



@Component({
  selector: 'app-task-page',
  imports: [
    SidePanelComponent,
    AllTaskListComponent,
    TaskDetailsComponent,
    MatIconModule,
    MatTabsModule,
    PersonalTaskListComponent,
    ProjectTaskListComponent
],
  templateUrl: './task-page.component.html',
  styleUrl: './task-page.component.scss',
  host: {
    class: 'page',
  },
})
export class TaskPageComponent {
  @ViewChild('taskPanel') taskPanel!: SidePanelComponent;

  public readonly taskManager = inject(TaskManager);

  public selectedTask = signal<Task | null>(null);

  public closeSideNav(): void {
    this.taskPanel.close();
  }

  public toggleSideNav(): void {
    this.taskPanel.toggle();
  }

  public selectTask(task: Task): void {
    this.selectedTask.set(task);
    this.taskPanel.open();
  }
}
