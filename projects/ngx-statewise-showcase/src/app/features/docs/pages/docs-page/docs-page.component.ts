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
  source: 'Task',
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
      'The engine reads a one-shot source itself, so a repository call needs no unwrapping in the effect. Only the first emission counts, and a source completing without emitting is a result without action — which is not the same as firstValueFrom, whose EmptyError would turn that into a failure.',
    snippet: `createEffect(getAllProjectsActions.request, () =>
  this.projectRepository.getAll(user).pipe(
    map((projects) => getAllProjectsActions.success(projects)),
    catchError(() => of(getAllProjectsActions.failure())),
  ),
);`,
    seenIn: 'features/project/states/project/project.effect.ts',
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
