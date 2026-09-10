import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { injectStatewise } from 'ngx-statewise';
import { ReportedErrors } from '@app/core/services';
import { getAllTaskActions } from '@app/features/project/states/task/task.action';
import {
  NoticeDemoComponent,
  TallyDemoComponent,
} from '@app/features/inspection/components';
import { NoticeState } from '@app/features/inspection/states';
import { AuthManager } from '@app/features/auth/states';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import { TaskManager } from '@app/features/project/states/task/task.manager';
import { CurrentProjectService } from '@app/features/project/services';

/** One line of a readout: a label and the value read at render time. */
export interface StateReading {
  readonly label: string;
  readonly value: string;
}

/**
 * Reads the managers' signals straight through, so the page redraws itself
 * whenever the state moves. That is the difference with the history page,
 * which reads a snapshot and needs asking.
 */
@Component({
  selector: 'app-inspection-live-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    NoticeDemoComponent,
    TallyDemoComponent,
  ],
  templateUrl: './inspection-live-page.component.html',
  styleUrl: './inspection-live-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class InspectionLivePageComponent {
  private readonly authManager = inject(AuthManager);
  private readonly taskManager = inject(TaskManager);
  private readonly projectManager = inject(ProjectManager);
  private readonly currentProject = inject(CurrentProjectService);
  private readonly noticeState = inject(NoticeState);
  private readonly reportedErrors = inject(ReportedErrors);

  /**
   * Owns no updater at all, which is what makes it useful here: it reaches the
   * globally registered notice updater, and it is refused for an action a
   * manager owns.
   */
  private readonly bareHandle = injectStatewise();

  public readonly authReadings = computed<StateReading[]>(() => [
    { label: 'user', value: this.authManager.user()?.userName ?? '(none)' },
    { label: 'role', value: this.authManager.user()?.role ?? '(none)' },
    { label: 'isLoggedIn', value: String(this.authManager.isLoggedIn()) },
    { label: 'isAdmin', value: String(this.authManager.isAdmin()) },
    { label: 'isLoading', value: String(this.authManager.isLoading()) },
    { label: 'isError', value: String(this.authManager.isError()) },
  ]);

  public readonly taskReadings = computed<StateReading[]>(() => {
    const counts = this.taskManager.countByStatus();

    return [
      { label: 'taskCount', value: String(this.taskManager.taskCount()) },
      ...Object.entries(counts).map(([status, count]) => ({
        label: status,
        value: String(count),
      })),
      { label: 'isLoading', value: String(this.taskManager.isLoading()) },
      { label: 'isSaving', value: String(this.taskManager.isSaving()) },
      { label: 'isError', value: String(this.taskManager.isError()) },
      { label: 'saveError', value: this.taskManager.saveError() ?? '(none)' },
    ];
  });

  /**
   * The same counts, narrowed to the chosen project. Nothing stores them: they
   * are a derivation over the task state and the project state, and choosing a
   * project moves every line at once.
   */
  public readonly currentProjectReadings = computed<StateReading[]>(() => [
    { label: 'currentProject', value: this.currentProject.title() },
    { label: 'taskCount', value: String(this.currentProject.taskCount()) },
    ...Object.entries(this.currentProject.countByStatus()).map(
      ([status, count]) => ({ label: status, value: String(count) }),
    ),
  ]);

  public readonly projectReadings = computed<StateReading[]>(() => [
    {
      label: 'projectCount',
      value: String(this.projectManager.projectCount()),
    },
    {
      label: 'selectedProjectId',
      value: this.projectManager.selectedProjectId() ?? '(none)',
    },
    { label: 'isLoading', value: String(this.projectManager.isLoading()) },
    { label: 'isError', value: String(this.projectManager.isError()) },
  ]);

  public readonly noticeReadings = computed<StateReading[]>(() => [
    { label: 'message', value: this.noticeState.message() ?? '(none)' },
    { label: 'raisedCount', value: String(this.noticeState.raisedCount()) },
  ]);

  /** What the application decided to do with a failure instead of hiding it. */
  public readonly reported = this.reportedErrors.all;

  /**
   * Dispatches an action this handle does not own, on purpose.
   *
   * `TASK_REQUEST` is claimed by the task updater, which is attached to the
   * task manager, and this handle owns no updater at all. So the engine
   * refuses it rather than letting the dispatch skip its state update in
   * silence, which is what used to happen before the check existed.
   */
  public dispatchMisrouted(): void {
    try {
      this.bareHandle.dispatch(getAllTaskActions.request());
    } catch (error) {
      // Development throws at the dispatch site; production hands the same
      // error to the ErrorHandler. The panel shows it either way.
      this.reportedErrors.record(error);
    }
  }

  public clearReported(): void {
    this.reportedErrors.clear();
  }

  public reloadTasks(): void {
    this.taskManager.getAll();
  }

  public reloadProjects(): void {
    this.projectManager.getAll();
  }
}
