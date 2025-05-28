import { Component, inject, signal, ViewChild } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { SidePanelComponent } from '@app/core/layouts/side-panel/side-panel.component';
import { TaskManager } from '../../states';
import { TaskDetailsComponent, AllTaskListComponent } from './components';
import { Task } from '../../models';


@Component({
  selector: 'app-task-page',
  imports: [
    SidePanelComponent,
    AllTaskListComponent,
    TaskDetailsComponent,
    MatIconModule,
    MatTabsModule,
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

  ngOnInit(): void {
    this.init();
  }

  private init(): void {
    this.taskManager.getAll();
  }

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
