import { Component, inject, signal, ViewChild } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { TaskManager } from '../../states';
import { SidePanelComponent } from '@app/core/layouts/side-panel/side-panel.component';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-page',
  imports: [SidePanelComponent, SlicePipe],
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
    this.taskManager.getAllTask();
  }

  public openSideNav(): void {
    this.taskPanel.open();
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
