import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { SidePanelComponent } from '@shared/ui/side-panel';
import { SectionCardComponent } from '@shared/ui/section-card';
import { Task } from '@app/features/project/models';
import { DataStateComponent } from '@shared/ui/data-state';
import {
  PersonalTaskListComponent,
  ProjectPickerComponent,
  TaskDetailsComponent,
} from '@app/features/project/components';
import { UserPickerComponent } from '@app/features/auth/components';
import { TaskManager } from '@app/features/project/states/task/task.manager';

/**
 * What there is to do, and where it is.
 *
 * It used to be the task page again: every task in a table, every task on a
 * board, both of them a second copy of what `/task` shows better. What a
 * dashboard is for is the view from above — which projects exist and what is
 * in them, and which of it is yours — and then getting out of the way.
 */
@Component({
  selector: 'app-dashboard-page',
  imports: [
    DataStateComponent,
    PersonalTaskListComponent,
    ProjectPickerComponent,
    SectionCardComponent,
    SidePanelComponent,
    TaskDetailsComponent,
    UserPickerComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class DashboardPageComponent {
  public readonly taskManager = inject(TaskManager);
  private readonly router = inject(Router);

  private readonly selectedTaskId = signal<string | null>(null);

  /**
   * Derived rather than stored, like the board's: a task that changed used to
   * leave the panel showing the version it had before.
   */
  public readonly selectedTask = computed<Task | null>(() => {
    const taskId = this.selectedTaskId();

    return taskId === null
      ? null
      : (this.taskManager.tasks().find((task) => task.id === taskId) ?? null);
  });

  /** Whether the panel is open, which is the panel's own `model`. */
  public readonly panelOpen = signal(false);

  public selectTask(task: Task): void {
    this.selectedTaskId.set(task.id);
    this.panelOpen.set(true);
  }

  public closeSideNav(): void {
    this.panelOpen.set(false);
  }

  /**
   * Choosing a project here is choosing it everywhere — the state is one — so
   * the only thing left to do is go where it can be worked on.
   */
  public async openBoard(): Promise<void> {
    await this.router.navigate(['/task']);
  }
}
