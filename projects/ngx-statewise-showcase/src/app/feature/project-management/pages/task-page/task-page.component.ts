import { Component, inject, ViewChild } from '@angular/core';
import { TaskManager } from '../../states';
import { SidePanelComponent } from '@app/core/layouts/side-panel/side-panel.component';



@Component({
  selector: 'app-task-page',
  imports: [SidePanelComponent],
  templateUrl: './task-page.component.html',
  styleUrl: './task-page.component.scss',
})
export class TaskPageComponent {
  @ViewChild('taskPanel') taskPanel!: SidePanelComponent;
  public readonly taskManager = inject(TaskManager);

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
}
