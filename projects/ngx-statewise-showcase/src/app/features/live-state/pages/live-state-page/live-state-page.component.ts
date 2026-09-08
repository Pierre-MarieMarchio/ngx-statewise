import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { injectStatewise } from 'ngx-statewise';
import {
  AUTH_MANAGER,
  PROJECT_MANAGER,
  TASK_MANAGER,
} from '@shared/app-common/tokens';
import { NoticeState, noticeActions } from '@app/features/notice/states';
import {
  TallyState,
  tallyActions,
  tallyUpdater,
} from '@app/features/tally/states';

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
  selector: 'app-live-state-page',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './live-state-page.component.html',
  styleUrl: './live-state-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class LiveStatePageComponent {
  private readonly authManager = inject(AUTH_MANAGER);
  private readonly taskManager = inject(TASK_MANAGER);
  private readonly projectManager = inject(PROJECT_MANAGER);
  private readonly noticeState = inject(NoticeState);
  public readonly tallyState = inject(TallyState);

  private readonly bareHandle = injectStatewise();
  private readonly tallyHandle = injectStatewise(tallyUpdater);

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
    ];
  });

  public readonly projectReadings = computed<StateReading[]>(() => [
    {
      label: 'projectCount',
      value: String(this.projectManager.projectCount()),
    },
    { label: 'isLoading', value: String(this.projectManager.isLoading()) },
    { label: 'isError', value: String(this.projectManager.isError()) },
  ]);

  public readonly noticeReadings = computed<StateReading[]>(() => [
    { label: 'message', value: this.noticeState.message() ?? '(none)' },
    { label: 'raisedCount', value: String(this.noticeState.raisedCount()) },
  ]);

  public raiseNotice(): void {
    this.bareHandle.dispatch(
      noticeActions.raised('raised from the state page'),
    );
  }

  public incrementTally(): void {
    this.tallyHandle.dispatch(tallyActions.incremented(1));
  }

  public reloadTasks(): void {
    this.taskManager.getAll();
  }

  public reloadProjects(): void {
    this.projectManager.getAll();
  }
}
