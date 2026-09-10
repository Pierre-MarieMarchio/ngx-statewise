import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SidePanelComponent } from '@shared/ui/side-panel';
import { DataStateComponent } from '@shared/ui/data-state';
import {
  PersonalTaskListComponent,
  ProjectFormComponent,
  ProjectPickerComponent,
  TaskDetailsComponent,
  TaskFormComponent,
  TaskKanbanComponent,
  TaskSearchComponent,
  TaskTableComponent,
} from '@app/features/project/components';
import { CurrentProjectService } from '@app/features/project/services';
import { ProjectDraft, Task, TaskDraft } from '@app/features/project/models';
import { ConfirmPanelComponent } from '@shared/ui/confirm-panel';
import { TaskManager } from '@app/features/project/states/task/task.manager';
import { ProjectManager } from '@app/features/project/states/project/project.manager';

@Component({
  selector: 'app-board-page',
  imports: [
    SidePanelComponent,
    ConfirmPanelComponent,
    DataStateComponent,
    TaskDetailsComponent,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatSelectModule,
    PersonalTaskListComponent,
    ProjectFormComponent,
    ProjectPickerComponent,
    TaskFormComponent,
    TaskKanbanComponent,
    TaskSearchComponent,
    TaskTableComponent,
  ],
  templateUrl: './board-page.component.html',
  styleUrl: './board-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class BoardPageComponent {
  public readonly taskManager = inject(TaskManager);
  /**
   * Two of the four tabs group by project, so a project load that failed is
   * this page's problem to report. It used to be invisible here, and
   * permanent.
   */
  public readonly projectManager = inject(ProjectManager);

  /**
   * What every tab on this page is looking at. With no project chosen it
   * answers for all of them, so choosing narrows the page rather than being
   * something it cannot work without.
   */
  public readonly currentProject = inject(CurrentProjectService);

  /**
   * Which tab is showing, held here because choosing a project on the last one
   * has to bring the board it chose into view, a choice whose result is three
   * tabs away is a choice nobody sees the effect of.
   */
  public readonly selectedTab = signal(0);

  /**
   * What the selector holds for "all of them".
   *
   * Not `null`: a `mat-select` reads a null value as no selection at all and
   * draws an empty box, so the one option that means something would have been
   * the one with nothing written in it.
   */
  public readonly allProjects = 'all-projects';

  public onProjectPicked(value: string): void {
    this.projectManager.selectProject(
      value === this.allProjects ? null : value,
    );
  }

  private readonly selectedTaskId = signal<string | null>(null);

  /**
   * The selected task as the state has it, not as it was when it was clicked.
   *
   * It used to be a snapshot, so a card the user dragged, or one the server
   * refused and the rollback put back, went on being shown in the panel the
   * way it had been. An id and a derivation cost the same and cannot go stale.
   */
  public readonly selectedTask = computed<Task | null>(() => {
    const taskId = this.selectedTaskId();

    return taskId === null
      ? null
      : (this.taskManager.tasks().find((task) => task.id === taskId) ?? null);
  });

  /**
   * What the one side panel is showing. Details and the three forms share it
   * rather than each bringing a panel of its own, so opening one closes
   * whatever was there, which is what a single panel means.
   */
  public readonly panel = signal<
    | 'task'
    | 'new-project'
    | 'new-task'
    | 'edit-task'
    | 'edit-project'
    | 'delete-project'
    | 'delete-task'
  >('task');

  /** Whether the panel is open, which is the panel's own `model`. */
  public readonly panelOpen = signal(false);

  public closeSideNav(): void {
    this.panelOpen.set(false);
  }

  public openNewProject(): void {
    this.panel.set('new-project');
    this.panelOpen.set(true);
  }

  public openNewTask(): void {
    this.panel.set('new-task');
    this.panelOpen.set(true);
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

  public selectTask(task: Task): void {
    this.selectedTaskId.set(task.id);
    this.panel.set('task');
    this.panelOpen.set(true);
  }

  /**
   * A project was chosen on the last tab, so the board it chose comes into
   * view. A choice whose result is three tabs away is a choice nobody sees the
   * effect of.
   */
  public onProjectChosen(): void {
    this.selectedTab.set(0);
  }

  public editTask(): void {
    this.panel.set('edit-task');
  }

  /**
   * The one write in this application that carries more than one field.
   *
   * The draft is merged onto the task the state holds, so `pendingWrites` puts
   * that exact version back if the server refuses, which it does when a task
   * is marked done with nobody on it. The panel goes back to reading, and the
   * card reverts underneath it without the panel having to be told.
   */
  public saveTask(draft: TaskDraft): void {
    const task = this.selectedTask();

    if (!task) {
      return;
    }

    this.taskManager.update({ ...task, ...draft });
    this.panel.set('task');
  }

  public onTaskChanged(updatedTask: Task): void {
    this.taskManager.update(updatedTask);
  }

  public openEditProject(): void {
    this.panel.set('edit-project');
    this.panelOpen.set(true);
  }

  public openDeleteProject(): void {
    this.panel.set('delete-project');
    this.panelOpen.set(true);
  }

  public async saveProject(draft: ProjectDraft): Promise<void> {
    const project = this.projectManager.selectedProject();

    if (!project) {
      return;
    }

    await this.projectManager.updateProject({ ...project, ...draft });

    // Kept open on a refusal, so the reason stays beside the field that
    // caused it, the same rule the creation forms follow.
    if (this.projectManager.saveError() === null) {
      this.closeSideNav();
    }
  }

  /**
   * The refusal that has a way out: the server will not remove a project that
   * still holds tasks, and says how many. So the panel stays open on it, and
   * what to do about it is one tab away.
   */
  public async confirmDeleteProject(): Promise<void> {
    const project = this.projectManager.selectedProject();

    if (!project) {
      return;
    }

    await this.projectManager.deleteProject(project.id);

    if (this.projectManager.saveError() === null) {
      this.closeSideNav();
    }
  }

  public openDeleteTask(): void {
    this.panel.set('delete-task');
  }

  public async confirmDeleteTask(): Promise<void> {
    const task = this.selectedTask();

    if (!task) {
      return;
    }

    await this.taskManager.deleteTask(task.id);

    // The panel has nothing left to show once the row is gone, so it shuts.
    // The details behind it would be looking at a task that no longer is.
    if (this.taskManager.saveError() === null) {
      this.selectedTaskId.set(null);
      this.closeSideNav();
      this.panel.set('task');
    }
  }
}
