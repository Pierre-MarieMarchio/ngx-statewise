import {
  Component,
  inject,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { Task } from '@app/features/project/models';
import { SidePanelComponent } from '@shared/ui/side-panel';
import { DataStateComponent } from '@shared/ui/data-state';
import { TaskDetailsComponent } from '@app/features/project/components';
import {
  TaskKanbanComponent,
  AllTaskListComponent,
  PersonalTaskListComponent,
  ProjectTaskListComponent,
} from '@app/features/project/components';
import { TaskManager } from '@app/features/project/states/task/task.manager';
import { ProjectManager } from '@app/features/project/states/project/project.manager';

@Component({
  selector: 'app-board-page',
  imports: [
    SidePanelComponent,
    AllTaskListComponent,
    DataStateComponent,
    TaskDetailsComponent,
    MatIconModule,
    MatTabsModule,
    PersonalTaskListComponent,
    ProjectTaskListComponent,
    TaskKanbanComponent,
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class BoardPageComponent {
  @ViewChild('taskPanel') taskPanel!: SidePanelComponent;

  public readonly taskManager = inject(TaskManager);
  /**
   * Two of the four tabs group by project, so a project load that failed is
   * this page's problem to report — it used to be invisible here, and
   * permanent.
   */
  public readonly projectManager = inject(ProjectManager);

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

  public onTaskChanged(updatedTask: Task): void {
    this.taskManager.update(updatedTask);
  }
}
