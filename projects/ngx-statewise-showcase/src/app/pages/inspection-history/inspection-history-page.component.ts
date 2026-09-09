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
  type HistoryEntry,
} from 'ngx-statewise';
import { noticeActions } from '@app/features/inspection/states';
import { tallyActions, tallyUpdater } from '@app/features/inspection/states';
import { getAllTaskActions } from '@app/features/project/states/task/task.action';
import { getAllProjectsActions } from '@app/features/project/states/project/project.action';
import { TaskManager } from '@app/features/project/states/task/task.manager';

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
  selector: 'app-inspection-history-page',
  imports: [MatButtonModule, MatChipsModule, MatTableModule],
  templateUrl: './inspection-history-page.component.html',
  styleUrl: './inspection-history-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class InspectionHistoryPageComponent {
  /**
   * Three dispatch origins, one history. The history is injected rather than
   * read off a handle, precisely because it is application-wide: no scope owns
   * it, so no scope should hand it out.
   */
  private readonly history = inject(ActionHistory);
  private readonly bareHandle = injectStatewise();
  private readonly tallyHandle = injectStatewise(tallyUpdater);
  private readonly taskManager = inject(TaskManager);

  public readonly trackedTypes = TRACKED_ACTION_TYPES;
  public readonly displayedColumns = ['position', 'type', 'cascade', 'payload'];

  /**
   * `snapshot()` hands back a plain array rather than a signal, so the table
   * holds what the last read saw and refreshes when asked.
   */
  private readonly recorded = signal<readonly HistoryEntry[]>([]);
  public readonly selectedType = signal<string | null>(null);

  public readonly rows = computed(() => {
    const selected = this.selectedType();
    const entries = selected
      ? this.recorded().filter((entry) => entry.action.type === selected)
      : this.recorded();

    return entries.map((entry, index) => ({
      position: index + 1,
      type: entry.action.type,
      // The path the engine walked to get here, read the way the cascade-bound
      // error reads it. A single dispatch shows one type; a cascade of three
      // shows three rows whose paths extend each other.
      cascade: entry.cascade.join(' \u2192 '),
      payload: abbreviate(entry.action.payload),
    }));
  });

  public readonly total = computed(() => this.recorded().length);

  public readonly counts = computed(() => {
    const entries = this.recorded();

    return this.trackedTypes.map((tracked) => ({
      ...tracked,
      count: entries.filter((entry) => entry.action.type === tracked.type)
        .length,
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

  /**
   * Only records what the listbox already decided. The toggle used to live
   * here, driven by a `(click)` the option never fires under a keyboard;
   * deselecting hands back nothing, which is the same as no filter.
   */
  public filterBy(type: string | undefined): void {
    this.selectedType.set(type ?? null);
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
