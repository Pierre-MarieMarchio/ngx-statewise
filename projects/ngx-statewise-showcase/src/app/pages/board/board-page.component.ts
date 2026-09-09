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
  ProjectFormComponent,
  ProjectTaskListComponent,
  TaskFormComponent,
} from '@app/features/project/components';
import { ProjectDraft, TaskDraft } from '@app/features/project/models';
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
    ProjectFormComponent,
    ProjectTaskListComponent,
    TaskFormComponent,
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

  /**
   * What the one side panel is showing. Details and the two forms share it
   * rather than each bringing a panel of its own, so opening one closes
   * whatever was there — which is what a single panel means.
   */
  public readonly panel = signal<'task' | 'new-project' | 'new-task'>('task');

  public closeSideNav(): void {
    this.taskPanel.close();
  }

  public openNewProject(): void {
    this.panel.set('new-project');
    this.taskPanel.open();
  }

  public openNewTask(): void {
    this.panel.set('new-task');
    this.taskPanel.open();
  }

  public async createProject(draft: ProjectDraft): Promise<void> {
    await this.projectManager.createProject(draft);

    // Kept open on a refusal, so the reason stays on screen beside the field
    // that caused it.
    if (this.projectManager.createError() === null) {
      this.closeSideNav();
    }
  }

  public async createTask(draft: TaskDraft): Promise<void> {
    await this.taskManager.createTask(draft);

    if (this.taskManager.createError() === null) {
      this.closeSideNav();
    }
  }

  public toggleSideNav(): void {
    this.taskPanel.toggle();
  }

  public selectTask(task: Task): void {
    this.selectedTask.set(task);
    this.panel.set('task');
    this.taskPanel.open();
  }

  public onTaskChanged(updatedTask: Task): void {
    this.taskManager.update(updatedTask);
  }
}
