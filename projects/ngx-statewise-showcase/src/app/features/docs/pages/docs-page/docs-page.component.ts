import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { NoticeDemoComponent } from '@app/features/notice/components/notice-demo/notice-demo.component';
import { TallyDemoComponent } from '@app/features/tally/components/tally-demo/tally-demo.component';

/** One documented mechanism, with the showcase code that exercises it. */
export interface DocsSection {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly snippet: string;
  readonly seenIn: string;
}

export const DOCS_SECTIONS: DocsSection[] = [
  {
    id: 'actions',
    title: 'Actions and groups',
    summary:
      'An action carries a type name and, when it needs one, a payload. A group shares a source across its events, so the type names stay derived instead of hand-written.',
    snippet: `export const getAllTaskActions = defineActionsGroup({
  source: 'TASK',
  events: {
    request: emptyPayload,
    success: payload<Task[]>(),
    failure: emptyPayload,
  },
});
// -> TASK_REQUEST, TASK_SUCCESS, TASK_FAILURE

export const taskReset = defineSingleAction('TASK_RESET', emptyPayload);
// -> TASK_RESET_ACTION`,
    seenIn: 'features/task/states/task/task.action.ts',
  },
  {
    id: 'updaters',
    title: 'Updaters, local and global',
    summary:
      'An updater says how one state reacts to actions. Its state is read from the injector, so two managers declaring the same action type keep separate states. A manager attaches its own updaters through injectStatewise; provideStatewise registers updaters reachable from any handle.',
    snippet: `export const taskUpdater = defineUpdater(TaskState, (on) => {
  on(getAllTaskActions.request, (state) => {
    state.isLoading.set(true);
  });
});

// owned by this manager
private readonly statewise = injectStatewise(taskUpdater);

// reachable from any handle, for the types no manager claims
provideStatewise({ updaters: [aGlobalUpdater] });`,
    seenIn: 'features/task/states/task/task.updater.ts',
  },
  {
    id: 'precedence',
    title: 'A manager updater shadows a global one',
    summary:
      'Global updaters are a fallback, not an addition: the engine reads the dispatching scope first and only then the global registry. An action type a manager already claims never reaches a global updater, so give global state action types of its own. Both handles below reach the notice updater, and neither owns it.',
    snippet: `// inside the engine
scope.updaters.get(actionType) ?? this.globalUpdaters.get(actionType)

// so this reaches the global updater, owning no updater at all
const statewise = injectStatewise();
statewise.dispatch(noticeActions.raised('saved'));`,
    seenIn: 'features/notice/states/notice/notice.updater.ts',
  },
  {
    id: 'plain-state',
    title: 'A state needs no signals',
    summary:
      'An updater reads its state from the injector and mutates it; nothing in the library requires that state to be reactive. Plain properties work, and what a signal buys back is the view refreshing on its own. Below, the deferred button dispatches from a timer started outside Angular, and the numbers stay behind until something redraws.',
    snippet: `@Injectable({ providedIn: 'root' })
export class TallyState {
  public total = 0;
  public lastStep = 0;
}

export const tallyUpdater = defineUpdater(TallyState, (on) => {
  on(tallyActions.incremented, (state, step) => {
    state.total += step;
    state.lastStep = step;
  });
});`,
    seenIn: 'features/tally/states/tally/tally.state.ts',
  },
  {
    id: 'manager-derived-state',
    title: 'Managers hand out read-only and derived state',
    summary:
      'A manager owns the dispatch handle and exposes the state around it: the raw signals read-only, so nothing outside writes them, and computed signals for what can be derived. A role, a count, a tally per status — none of that is stored twice, and a view reading them never has to recompute.',
    snippet: `export class TaskManager implements ITaskManager {
  private readonly taskStates = inject(TaskState);
  private readonly statewise = injectStatewise(taskUpdater);

  // read-only, never written from outside
  public readonly tasks = this.taskStates.tasks.asReadonly();

  // derived, never stored
  public readonly taskCount = computed(() => this.tasks().length);
  public readonly countByStatus = computed(() => /* one per status */);
}`,
    seenIn: 'features/task/states/task/task.manager.ts',
  },
  {
    id: 'effects',
    title: 'Effects',
    summary:
      'An effect runs when its action is dispatched and hands back further actions. It may return them directly or through a Promise, and the actions it returns are executed in the same dispatch, which is what dispatchAsync awaits.',
    snippet: `createEffect(getAllTaskActions.request, async () => {
  const tasks = await firstValueFrom(this.repository.getAll(user));
  return getAllTaskActions.success(tasks);
});`,
    seenIn: 'features/task/states/task/task.effect.ts',
  },
  {
    id: 'observable-effects',
    title: 'An effect may hand back an Observable',
    summary:
      'The engine reads a one-shot source itself, so a repository call needs no unwrapping in the effect. Only the first emission counts, and a source completing without emitting is a result without action — which is not the same as firstValueFrom, whose EmptyError would turn that into a failure. That silence is the trap: nothing would answer the request, and isLoading would stay set with nothing to clear it. Every branch of this pipeline produces an action, so the effect says so with mustAnswer and a source running dry is reported instead.',
    snippet: `createEffect(
  getAllProjectsActions.request,
  () =>
    this.projectRepository.getAll(user).pipe(
      map((projects) => getAllProjectsActions.success(projects)),
      catchError(() => of(getAllProjectsActions.failure())),
    ),
  { mustAnswer: true },
);`,
    seenIn: 'features/project/states/project/project.effect.ts',
  },
  {
    id: 'cascades',
    title: 'Effects cascade into chains of actions',
    summary:
      'The actions an effect returns are executed in the same dispatch, and their own effects run in turn. Signing in walks that chain across three managers, which is what the history page shows on arrival: LOGIN_REQUEST, LOGIN_SUCCESS, then PROJECT_REQUEST and TASK_REQUEST, then their two successes.',
    snippet: `createEffect(loginActions.request, async (credential) => {
  const res = await firstValueFrom(this.authRepository.login(credential));

  return loginActions.success(res.body);
});

createEffect(loginActions.success, () => {
  this.projectManager.getAll(); // dispatches PROJECT_REQUEST
  this.taskManager.getAll();    // dispatches TASK_REQUEST
  this.router.navigate(['/']);
});`,
    seenIn: 'features/auth/states/auth/auth.effect.ts',
  },
  {
    id: 'scoping',
    title: 'An effect runs for the manager owning its action',
    summary:
      'A dispatch reaching a scope that owns nothing of the action does not run its effects either: cascading their actions into the wrong scope would corrupt another manager. In development that misrouted dispatch throws; in production it reaches the ErrorHandler.',
    snippet: `// TASK_REQUEST is claimed by taskUpdater, which this handle does not own
const other = injectStatewise(projectUpdater);
other.dispatch(getAllTaskActions.request()); // misrouted: nothing runs`,
    seenIn: 'projects/ngx-statewise/src/integration/execution-contract.spec.ts',
  },
  {
    id: 'dispatch-modes',
    title: 'Dispatching synchronously or awaiting the cascade',
    summary:
      'dispatch applies the updater before it returns and leaves the effects running, reporting a failure to the ErrorHandler. dispatchAsync hands back a promise that settles once the whole cascade started by the action is over, failure included. Same action, two ways of waiting for it.',
    snippet: `public getAll(): void {
  // the updater has run by the time this returns; the effects keep going
  this.statewise.dispatch(getAllTaskActions.request());
}

public getAllAsync(): Promise<void> {
  // settles once the effects, and the actions they returned, are done
  return this.statewise.dispatchAsync(getAllTaskActions.request());
}`,
    seenIn: 'features/task/states/task/task.manager.ts',
  },
  {
    id: 'concurrency',
    title: 'Two dispatches racing each other',
    summary:
      'By default every dispatch runs its own effect, and a slow answer landing after a fast one overwrites it. The board declares latest with one key per task instead: dragging the same card twice abandons its own earlier write, while dragging a second card abandons nothing. An abandoned run fires the abortSignal its handler received, unsubscribes the request and drops its answer, so a stale response never reaches an updater. cancelOn ties the same mechanism to the reset that empties the list.',
    snippet: `createEffect(
  updateTaskActions.request,
  async (task) => { ... },
  { concurrency: 'latest', key: (task) => task.id, cancelOn: taskReset },
);`,
    seenIn: 'features/task/states/task/task.effect.ts',
  },
  {
    id: 'error-recovery',
    title: 'Failing, and recovering from it',
    summary:
      'A failure is an action like any other: the effect catches what went wrong and returns the failure event, whose updater puts the state back in a consistent shape. The board moves its cards before the server answers, so the failure carries the id of the card it concerns and the updater restores that one. Keeping the point of return per write is what a single error flag could not do: reverting on it took down every card in flight, including those the server had never refused.',
    snippet: `on(updateTaskActions.request, (state, task) => {
  // optimistic: the card moves now, and the version it replaced is kept
  const replaced = state.tasks().find((known) => known.id === task.id);
  state.pendingWrites.update((writes) => new Map(writes).set(task.id, replaced));
  state.tasks.update(carrying(task));
});

on(updateTaskActions.failure, (state, taskId) => {
  // one entry per write, so this puts back its own card and no other
  const replaced = state.pendingWrites().get(taskId);
  state.tasks.update(carrying(replaced));
});`,
    seenIn: 'features/task/states/task/task.updater.ts',
  },
  {
    id: 'rendered-state',
    title: 'Showing what the state says',
    summary:
      'A manager exposing isLoading and isError is only half of it: the views have to read them. One shared component renders both for a read — a labelled progress bar while it runs, and a live region when it fails, with a retry that dispatches again — and every list says so when it has nothing to show. The task manager also tells two states apart: isLoading is reading the list, while isSaving is derived from the writes still in flight, so the spinner does not stop on the first of several answers.',
    snippet: `<app-data-state
  label="tasks"
  [loading]="taskManager.isLoading() || taskManager.isSaving()"
  [error]="taskManager.isError()"
  [retryable]="true"
  (retried)="taskManager.getAll()"
/>

// derived, so it stays true until the last write has answered
public readonly isSaving = computed(
  () => this.taskStates.pendingWrites().size > 0,
);`,
    seenIn: 'shared/app-common/components/data-state/data-state.component.ts',
  },
  {
    id: 'live-state',
    title: 'Watching the state as it moves',
    summary:
      "Reading the managers' signals in a template is all it takes for a view to follow the state: the state page holds no copy and offers no refresh, it just redraws when a signal it read changes. The tally card on it is the counter-example, since plain properties notify nothing.",
    snippet: `public readonly taskReadings = computed(() => [
  { label: 'taskCount', value: String(this.taskManager.taskCount()) },
  ...Object.entries(this.taskManager.countByStatus()).map(
    ([status, count]) => ({ label: status, value: String(count) }),
  ),
]);`,
    seenIn:
      'features/live-state/pages/live-state-page/live-state-page.component.ts',
  },
  {
    id: 'history',
    title: 'Action history',
    summary:
      'The history is off until a limit is configured. It keeps the last dispatched actions, oldest first, application-wide — whichever handle executed them. It is injected rather than read off a dispatch handle, because no scope owns it. snapshot() hands back a plain array rather than a signal, so a view over it refreshes when asked, not on its own. Each entry is a frozen envelope of the history own, though the payload keeps its identity. And since an entry would otherwise hold whatever the action carried, redact replaces it before it is recorded: this showcase strips the login password that way.',
    snippet: `provideStatewise({
  history: { limit: 50, redact: withoutCredentials },
});

// a plain array, read at the moment of the call
const actions = inject(ActionHistory).snapshot();

// the dispatched action is untouched; only the entry differs
export function withoutCredentials(action: Action): Action {
  return action.type === ofType(loginActions.request)
    ? { type: action.type, payload: { email, password: '[redacted]' } }
    : action;
}`,
    seenIn: 'features/auth/states/auth/auth.redaction.ts',
  },
];

@Component({
  selector: 'app-docs-page',
  imports: [
    MatExpansionModule,
    MatIconModule,
    NoticeDemoComponent,
    TallyDemoComponent,
  ],
  templateUrl: './docs-page.component.html',
  styleUrl: './docs-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page',
  },
})
export class DocsPageComponent {
  public readonly sections = DOCS_SECTIONS;
}
