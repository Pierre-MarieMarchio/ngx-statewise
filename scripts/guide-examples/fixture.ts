/*
 * The world the guide's examples are written against.
 *
 * Every example in the guide names things it does not declare: a state class,
 * an action group, a repository it calls. That is right for a document, and it
 * is why the examples could never be compiled. This module declares that world
 * once, so an example can be type-checked as written instead of being padded
 * with declarations no reader needs.
 *
 * The rule for what goes in here: a name the guide uses without introducing
 * it. If an example introduces a name itself, it stays in the example.
 *
 * Nothing here runs. It exists to be type-checked against, so a body is
 * whatever satisfies the signature.
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  defineActionsGroup,
  defineSingleAction,
  defineUpdater,
  emptyPayload,
  payload,
} from 'ngx-statewise';

// --- the models ------------------------------------------------------------

export interface User {
  readonly id: string;
  readonly name: string;
}

export interface Session {
  readonly user: User;
  readonly userId: string;
  readonly accessToken: string;
}

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export type LoginSubmit = Credentials;

export interface LoginResponse extends Session {}

export interface Task {
  readonly id: string;
  readonly done: boolean;
  readonly title: string;
}

export interface Result {
  readonly id: string;
  readonly label: string;
}

export interface Settings {
  readonly density: string;
  readonly language: string;
}

export interface TeamMember {
  readonly id: string;
  readonly name: string;
}

// --- the states ------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class AuthState {
  public user = signal<User | null>(null);
  public isLoggedIn = signal(false);
  public isLoading = signal(false);
  public isError = signal(false);
  public readonly displayName = computed(() => this.user()?.name ?? 'Guest');
}

/** The plain-property shape the States page contrasts with the signal one. */
@Injectable({ providedIn: 'root' })
export class PlainAuthState {
  public user: User | null = null;
  public isLoading = false;
}

@Injectable({ providedIn: 'root' })
export class CounterStates {
  public count = signal(0);
}

@Injectable({ providedIn: 'root' })
export class TaskState {
  public tasks = signal<readonly Task[]>([]);
  public items = signal<readonly Task[]>([]);
  public pending = signal<ReadonlySet<string>>(new Set<string>());
  public lastError = signal<string | null>(null);
  public isLoading = signal(false);
  public isError = signal(false);
}

/** The guide spells this one both ways; both resolve to the same fields. */
export { TaskState as TaskStates };

@Injectable({ providedIn: 'root' })
export class SearchStates {
  public query = signal('');
  public results = signal<readonly Result[]>([]);
  public isSearching = signal(false);
  public attempt = signal(0);
}

@Injectable({ providedIn: 'root' })
export class SettingsStates {
  public density = signal('comfortable');
  public language = signal('en');

  public snapshot(): Settings {
    return { density: this.density(), language: this.language() };
  }
}

@Injectable({ providedIn: 'root' })
export class TallyState {
  public total = 0;
  public lastStep = 0;
}

/**
 * The state a wrapped fragment is compiled against.
 *
 * One class carrying every field the guide's `on(...)` and `asReadonly()`
 * examples reach for, rather than one class per page. A fragment names a field
 * and never says which state class it belongs to, so a checker that guessed
 * would guess wrong; a single union of the fields cannot.
 */
@Injectable({ providedIn: 'root' })
export class GuideState {
  public user = signal<User | null>(null);
  public isLoggedIn = signal(false);
  public isLoading = signal(false);
  public isError = signal(false);
  public count = signal(0);
  public tasks = signal<readonly Task[]>([]);
  public items = signal<readonly Task[]>([]);
  public pending = signal<ReadonlySet<string>>(new Set<string>());
  public lastError = signal<string | null>(null);
  public query = signal('');
  public results = signal<readonly Result[]>([]);
  public isSearching = signal(false);
  public attempt = signal(0);
  public density = signal('comfortable');
  public language = signal('en');
  public value = signal(0);

  public snapshot(): Settings {
    return { density: this.density(), language: this.language() };
  }
}

/**
 * The one collaborator a wrapped fragment calls, for the same reason.
 * `this.api` is a task API on one page and a search API on the next.
 */
@Injectable({ providedIn: 'root' })
export class GuideApi {
  public login(credentials: Credentials): Promise<LoginResponse> {
    void credentials;
    return Promise.resolve({} as LoginResponse);
  }

  public search(
    query: string,
    abortSignal?: AbortSignal,
  ): Promise<readonly Result[]> {
    void query;
    void abortSignal;
    return Promise.resolve([]);
  }

  public search$(query: string): Observable<readonly Result[]> {
    void query;
    return of([]);
  }

  public setDone(id: string, done: boolean): Promise<void> {
    void id;
    void done;
    return Promise.resolve();
  }

  public list(): Promise<readonly Task[]> {
    return Promise.resolve([]);
  }

  public fetchUser(userId: string): Observable<User> {
    return of({ id: userId, name: 'Ada' });
  }
}

/** Stands in wherever the guide writes a state token it never introduces. */
@Injectable({ providedIn: 'root' })
export class SomeStates {
  public value = signal(0);
}

// --- the actions -----------------------------------------------------------

export const loginActions = defineActionsGroup({
  source: 'LOGIN',
  events: {
    request: payload<LoginSubmit>(),
    success: payload<LoginResponse>(),
    failure: emptyPayload,
    cancel: emptyPayload,
    retry: payload<number>(),
  },
});

export const logoutAction = defineSingleAction('LOGOUT', emptyPayload);
export const selectItemAction = defineSingleAction(
  'SELECT_ITEM',
  payload<number>(),
);

export const authActions = defineActionsGroup({
  source: 'AUTH',
  events: { loaded: emptyPayload, refreshToken: emptyPayload },
});

export const counterActions = defineActionsGroup({
  source: 'COUNTER',
  events: { increment: emptyPayload, add: payload<number>() },
});

export const getAllTaskActions = defineActionsGroup({
  source: 'GET_ALL_TASK',
  events: {
    request: emptyPayload,
    success: payload<readonly Task[]>(),
    failure: emptyPayload,
  },
});

/*
 * `toggleConfirmed` carries the id, which is the shape the Optimistic updates
 * page declares and uses. That page then shows the variant carrying the whole
 * row, and one action cannot be both here: the variant's two blocks are marked
 * `fragment` for exactly that reason.
 */
export const taskActions = defineActionsGroup({
  source: 'TASK',
  events: {
    toggleDone: payload<string>(),
    toggleConfirmed: payload<string>(),
    toggleReverted: payload<{ id: string; reason: string }>(),
  },
});

export const taskReset = defineSingleAction('TASK_RESET', emptyPayload);
export const searchCleared = defineSingleAction('SEARCH_CLEARED', emptyPayload);

export const searchActions = defineActionsGroup({
  source: 'SEARCH',
  events: {
    query: payload<string>(),
    answered: payload<{ attempt: number; results: readonly Result[] }>(),
  },
});

export const settingsActions = defineActionsGroup({
  source: 'SETTINGS',
  events: { change: payload<Settings>(), restored: payload<Settings>() },
});

export const tallyActions = defineActionsGroup({
  source: 'TALLY',
  events: { incremented: payload<number>() },
});

export const noticeActions = defineActionsGroup({
  source: 'NOTICE',
  events: { raised: payload<string>(), cleared: emptyPayload },
});

export const getAllProjectsActions = defineActionsGroup({
  source: 'GET_ALL_PROJECTS',
  events: {
    request: emptyPayload,
    success: emptyPayload,
    failure: emptyPayload,
  },
});

export const userActions = defineActionsGroup({
  source: 'USER',
  events: {
    getUserRequest: payload<{ userId: string }>(),
    getUserSuccess: payload<User>(),
    getUserFailure: emptyPayload,
  },
});

export const socketActions = defineActionsGroup({
  source: 'SOCKET',
  events: { connect: emptyPayload, received: payload<string>() },
});

export const writeActions = defineActionsGroup({
  source: 'WRITE',
  events: { request: payload<{ value: string }>() },
});

export const TALLY_CEILING = 20;

// --- what the examples call ------------------------------------------------

@Injectable({ providedIn: 'root' })
export class AuthRepository {
  public login(credentials: Credentials): Promise<LoginResponse> {
    return Promise.resolve({
      user: { id: '1', name: 'Ada' },
      userId: '1',
      accessToken: 't',
      ...credentials,
    } as unknown as LoginResponse);
  }
}

export { AuthRepository as AuthRepositoryService };

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  public setAccessToken(token: string): void {
    void token;
  }
}

@Injectable({ providedIn: 'root' })
export class TaskApi {
  public setDone(id: string, done: boolean): Promise<void> {
    void id;
    void done;
    return Promise.resolve();
  }

  public list(): Promise<readonly Task[]> {
    return Promise.resolve([]);
  }
}

@Injectable({ providedIn: 'root' })
export class SearchApi {
  public search(
    query: string,
    abortSignal?: AbortSignal,
  ): Promise<readonly Result[]> {
    void query;
    void abortSignal;
    return Promise.resolve([]);
  }

  public search$(query: string): Observable<readonly Result[]> {
    void query;
    return of([]);
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  public fetchUser(userId: string): Observable<User> {
    void userId;
    return of({ id: userId, name: 'Ada' });
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsStorage {
  public read(): Settings | null {
    return null;
  }

  public write(settings: Settings): void {
    void settings;
  }
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  public record(what: string): Promise<void> {
    void what;
    return Promise.resolve();
  }
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  public readonly messages$: Observable<string> = of('');
}

/** The other feature's manager, for the cross-boundary examples. */
@Injectable({ providedIn: 'root' })
export class ProjectManager {
  public getAll(): void {}

  public getAllAsync(): Promise<void> {
    return Promise.resolve();
  }
}

@Injectable({ providedIn: 'root' })
export class TaskManager {
  private readonly state = inject(TaskState);

  public readonly items = this.state.items.asReadonly();
  public readonly pending = this.state.pending.asReadonly();
  public readonly lastError = this.state.lastError.asReadonly();

  public getAll(): void {}

  public getAllAsync(): Promise<void> {
    return Promise.resolve();
  }

  public refresh(): void {}

  public refreshAndSettle(): Promise<void> {
    return Promise.resolve();
  }

  public toggleDone(id: string): void {
    void id;
  }

  public toggleDoneAndSettle(id: string): Promise<void> {
    void id;
    return Promise.resolve();
  }
}

@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly state = inject(AuthState);

  public readonly user = this.state.user.asReadonly();
  public readonly isLoading = this.state.isLoading.asReadonly();

  public login(credentials: LoginSubmit): Promise<void> {
    void credentials;
    return Promise.resolve();
  }
}

// --- the pure helpers the recipes use --------------------------------------

export function flipDone(items: readonly Task[], id: string): readonly Task[] {
  return items.map((item) =>
    item.id === id ? { ...item, done: !item.done } : item,
  );
}

export function without(
  pending: ReadonlySet<string>,
  id: string,
): ReadonlySet<string> {
  const next = new Set(pending);

  next.delete(id);

  return next;
}

export function replace(items: readonly Task[], task: Task): readonly Task[] {
  return items.map((item) => (item.id === task.id ? task : item));
}

export function task(id: string): Task {
  return { id, done: false, title: id };
}

// --- the effect and interceptor classes the setup examples list ------------

@Injectable({ providedIn: 'root' })
export class AuthEffect {}
export { AuthEffect as AuthEffects };

@Injectable({ providedIn: 'root' })
export class UserEffect {}
export { UserEffect as UserEffects };

@Injectable({ providedIn: 'root' })
export class TaskEffect {}

@Injectable({ providedIn: 'root' })
export class ProjectEffect {}

@Injectable()
export class TallyGuard {}

@Injectable({ providedIn: 'root' })
export class LazyRouteEffect {}

// --- the updaters and helpers the pages reference across blocks ------------

/*
 * A page introduces an updater in one block and attaches it in the next. Each
 * block is compiled on its own, so the second one needs the name from here.
 */
export const authUpdater = defineUpdater(GuideState, (on) => {
  on(loginActions.request, (state) => {
    state.isLoading.set(true);
  });
});

export const counterUpdater = defineUpdater(GuideState, (on) => {
  on(counterActions.increment, (state) => {
    state.count.update((count) => count + 1);
  });
});

export const taskUpdater = defineUpdater(GuideState, (on) => {
  on(getAllTaskActions.success, (state, tasks) => {
    state.tasks.set(tasks);
  });
});

export const settingsUpdater = defineUpdater(GuideState, (on) => {
  on(settingsActions.change, (state, change) => {
    state.density.set(change.density);
  });
});

export const tallyUpdater = defineUpdater(GuideState, (on) => {
  on(tallyActions.incremented, (state, step) => {
    state.count.update((count) => count + step);
  });
});

export const noticeUpdater = defineUpdater(GuideState, (on) => {
  on(noticeActions.cleared, (state) => {
    state.lastError.set(null);
  });
});

export const getMembersActions = defineActionsGroup({
  source: 'GET_MEMBERS',
  events: {
    request: payload<string>(),
    success: payload<readonly TeamMember[]>(),
    failure: emptyPayload,
  },
});

@Injectable({ providedIn: 'root' })
export class SettingsManager {
  public start(): void {}
}

/**
 * The double the testing page builds its suite around.
 *
 * The members are typed as the page uses them: called, asserted on with
 * `toHaveBeenCalledWith`, and reprogrammed with `mockRejectedValue`. What a
 * runner actually hands back is its own business.
 */
interface Mocked<Args extends readonly unknown[], Answer> {
  (...args: Args): Answer;
  mockResolvedValue(value: Awaited<Answer>): void;
  mockRejectedValue(reason: unknown): void;
}

export class FakeTaskApi {
  public setDone!: Mocked<[string, boolean], Promise<void>>;
  public list!: Mocked<[], Promise<readonly Task[]>>;
}

/** The two suite helpers the testing page defines and then calls elsewhere. */
export function manager(): TaskManager {
  return {} as TaskManager;
}

export function suite(api?: FakeTaskApi): {
  tasks: TaskManager;
  api: FakeTaskApi;
} {
  void api;
  return {} as { tasks: TaskManager; api: FakeTaskApi };
}
