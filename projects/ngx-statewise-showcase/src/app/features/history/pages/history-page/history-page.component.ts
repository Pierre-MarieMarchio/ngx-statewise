import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import {
  ActionHistory,
  injectStatewise,
  ofType,
  type Action,
} from 'ngx-statewise';
import { TASK_MANAGER } from '@shared/app-common/tokens';
import { noticeActions } from '@app/features/notice/states';
import { tallyActions, tallyUpdater } from '@app/features/tally/states';
import { getAllTaskActions } from '@app/features/project/states/task/task.action';
import { getAllProjectsActions } from '@app/features/project/states/project/project.action';

/** Beyond this, a payload is cut short: some of them carry whole collections. */
export const MAX_PAYLOAD_LENGTH = 120;

/** One action type the dashboard counts, named off its creator. */
export interface TrackedActionType {
  readonly label: string;
  readonly type: string;
}

/**
 * `ofType` reads the type name off the creator, so these labels never repeat
 * the string the creator already owns: renaming a source renames them too.
 */
export const TRACKED_ACTION_TYPES: TrackedActionType[] = [
  { label: 'Notice raised', type: ofType(noticeActions.raised) },
  { label: 'Notice cleared', type: ofType(noticeActions.cleared) },
  { label: 'Tally incremented', type: ofType(tallyActions.incremented) },
  { label: 'Tasks loaded', type: ofType(getAllTaskActions.success) },
  { label: 'Projects loaded', type: ofType(getAllProjectsActions.success) },
];

@Component({
  selector: 'app-history-page',
  imports: [MatButtonModule, MatChipsModule, MatTableModule],
  templateUrl: './history-page.component.html',
  styleUrl: './history-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class HistoryPageComponent {
  /**
   * Three dispatch origins, one history. The history is injected rather than
   * read off a handle, precisely because it is application-wide: no scope owns
   * it, so no scope should hand it out.
   */
  private readonly history = inject(ActionHistory);
  private readonly bareHandle = injectStatewise();
  private readonly tallyHandle = injectStatewise(tallyUpdater);
  private readonly taskManager = inject(TASK_MANAGER);

  public readonly trackedTypes = TRACKED_ACTION_TYPES;
  public readonly displayedColumns = ['position', 'type', 'payload'];

  /**
   * `snapshot()` hands back a plain array rather than a signal, so the table
   * holds what the last read saw and refreshes when asked.
   */
  private readonly recorded = signal<readonly Action[]>([]);
  public readonly selectedType = signal<string | null>(null);

  public readonly rows = computed(() => {
    const selected = this.selectedType();
    const actions = selected
      ? this.recorded().filter((action) => action.type === selected)
      : this.recorded();

    return actions.map((action, index) => ({
      position: index + 1,
      type: action.type,
      payload: abbreviate(action.payload),
    }));
  });

  public readonly total = computed(() => this.recorded().length);

  public readonly counts = computed(() => {
    const actions = this.recorded();

    return this.trackedTypes.map((tracked) => ({
      ...tracked,
      count: actions.filter((action) => action.type === tracked.type).length,
    }));
  });

  public refresh(): void {
    this.recorded.set(this.history.snapshot());
  }

  public raiseNotice(): void {
    this.bareHandle.dispatch(noticeActions.raised('raised from the history'));
    this.refresh();
  }

  public incrementTally(): void {
    this.tallyHandle.dispatch(tallyActions.incremented(1));
    this.refresh();
  }

  public async reloadTasks(): Promise<void> {
    await this.taskManager.getAllAsync();
    this.refresh();
  }

  public filterBy(type: string): void {
    this.selectedType.update((current) => (current === type ? null : type));
  }

  public clearFilter(): void {
    this.selectedType.set(null);
  }
}

/**
 * The history keeps payloads as they were dispatched, so this only shortens
 * them for reading. What must not be kept at all goes through the `redact`
 * hook instead — `app.config.ts` strips the login password there. What to put
 * in an action, and whether to enable the history, stay decisions for the
 * application.
 */
function abbreviate(payload: unknown): string {
  if (payload === undefined) {
    return '';
  }

  const serialized = JSON.stringify(payload) ?? '';

  return serialized.length > MAX_PAYLOAD_LENGTH
    ? `${serialized.slice(0, MAX_PAYLOAD_LENGTH)}…`
    : serialized;
}
