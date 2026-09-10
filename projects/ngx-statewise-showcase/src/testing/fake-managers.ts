import { computed, signal, WritableSignal } from '@angular/core';
import { LoginSubmit, User } from '@app/features/auth/models';
import {
  IAuthSession,
  IProjectReload,
  ITaskReload,
  SessionUser,
} from '@app/features/common';
import { ITeamDirectory, TeamMember } from '@app/features/project/ports';
import {
  Project,
  ProjectDraft,
  STATUSES,
  Task,
  TaskDraft,
  TaskStatus,
} from '@app/features/project/models';

/**
 * Two families, because the showcase crosses two kinds of boundary.
 *
 * **Narrow doubles** stand in for a port of the shared kernel: three members
 * at most, provided against its token, and used by the feature on the far side
 * of the boundary. They are deliberately as small as the port, so a spec that
 * needs more than these is a spec whose subject is reaching too far.
 *
 * **Wide doubles** stand in for a manager, provided against the class itself,
 * and used by a page or by the feature that owns the manager. They expose
 * their signals as writable ones and record the calls a spec asserts on.
 */

export const sampleUser = (overrides: Partial<User> = {}): User => ({
  userId: 'user-1',
  userName: 'admin',
  email: 'admin@admin',
  role: 'admin',
  organizationId: 'org-1',
  ...overrides,
});

export const sampleProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  title: 'Analytics Dashboard',
  color: 'orange',
  ...overrides,
});

export const sampleTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'project-1',
  organizationId: 'org-1',
  title: 'Wire the showcase to a smoke test',
  description: 'Mount every component once and assert it rendered.',
  status: 'todo',
  priority: 'high',
  assignedUserIds: ['user-1'],
  dueDate: '2026-12-01',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...overrides,
});

/* --- Narrow: the shared kernel's ports ------------------------------------ */

export interface FakeAuthSession extends IAuthSession {
  user: WritableSignal<SessionUser | null>;
}

export const fakeAuthSession = (
  user: SessionUser | null = sampleUser(),
): FakeAuthSession => ({ user: signal(user) });

export const sampleMembers = (): TeamMember[] => [
  { id: 'user-1', name: 'admin' },
  { id: 'user-2', name: 'user1' },
];

/**
 * Narrow, like the kernel's doubles, although the port is `features/project`'s
 * own: it is read across a boundary all the same, and a spec that needs more
 * of it than two members is reaching past its subject.
 */
export interface FakeTeamDirectory extends ITeamDirectory {
  members: WritableSignal<readonly TeamMember[]>;
}

export const fakeTeamDirectory = (
  members: readonly TeamMember[] = sampleMembers(),
): FakeTeamDirectory => {
  const known = signal(members);

  return {
    members: known,
    nameOf: (userId) =>
      known().find((member) => member.id === userId)?.name ?? userId,
  };
};

export interface FakeTaskReload extends ITaskReload {
  readonly calls: string[];
}

export const fakeTaskReload = (): FakeTaskReload => {
  const calls: string[] = [];

  return {
    calls,
    getAll: () => {
      calls.push('getAll');
    },
    reset: () => {
      calls.push('reset');

      return Promise.resolve();
    },
    reloaded: () => Promise.resolve(),
  };
};

export interface FakeProjectReload extends IProjectReload {
  readonly calls: string[];
}

export const fakeProjectReload = (): FakeProjectReload => {
  const calls: string[] = [];

  return {
    calls,
    getAll: () => {
      calls.push('getAll');
    },
    reset: () => {
      calls.push('reset');

      return Promise.resolve();
    },
    settled: () => Promise.resolve(),
  };
};

/* --- Wide: the manager classes -------------------------------------------- */

export interface FakeAuthManager {
  user: WritableSignal<User | null>;
  isLoggedIn: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
  isError: WritableSignal<boolean>;
  readonly isAdmin: ReturnType<typeof computed<boolean>>;
  readonly logins: LoginSubmit[];
  readonly logouts: string[];
  login(credential: LoginSubmit): Promise<void>;
  authenticate(): Promise<void>;
  logout(): void;
}

export const fakeAuthManager = (
  user: User | null = sampleUser(),
): FakeAuthManager => {
  const logins: LoginSubmit[] = [];
  const logouts: string[] = [];

  const userSignal = signal(user);

  return {
    user: userSignal,
    isLoggedIn: signal(user !== null),
    isLoading: signal(false),
    isError: signal(false),
    isAdmin: computed(() => userSignal()?.role === 'admin'),
    logins,
    logouts,
    login: (credential: LoginSubmit) => {
      logins.push(credential);
      return Promise.resolve();
    },
    authenticate: () => Promise.resolve(),
    logout: () => {
      logouts.push('logout');
    },
  };
};

export interface FakeTaskManager extends ITaskReload {
  tasks: WritableSignal<Task[]>;
  isError: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
  isSaving: WritableSignal<boolean>;
  readonly taskCount: ReturnType<typeof computed<number>>;
  readonly countByStatus: ReturnType<
    typeof computed<Record<TaskStatus, number>>
  >;
  readonly updates: Task[];
  saveError: WritableSignal<string | null>;
  isCreating: WritableSignal<boolean>;
  createError: WritableSignal<string | null>;
  readonly created: TaskDraft[];
  isSearching: WritableSignal<boolean>;
  searchFailed: WritableSignal<boolean>;
  matches: WritableSignal<Task[] | null>;
  readonly isFiltered: ReturnType<typeof computed<boolean>>;
  readonly visibleTasks: ReturnType<typeof computed<Task[]>>;
  readonly writingIds: ReturnType<typeof computed<ReadonlySet<string>>>;
  readonly queries: string[];
  readonly searchClears: number[];
  readonly deleted: string[];
  writing: WritableSignal<ReadonlySet<string>>;
  getAllAsync(): Promise<void>;
  update(task: Task): void;
  deleteTask(taskId: string): Promise<void>;
  createTask(draft: TaskDraft): Promise<void>;
  search(query: string): void;
  clearSearch(): void;
}

export const fakeTaskManager = (
  tasks: Task[] = [sampleTask()],
): FakeTaskManager => {
  const updates: Task[] = [];
  const created: TaskDraft[] = [];
  const deleted: string[] = [];
  const queries: string[] = [];
  const searchClears: number[] = [];

  const tasksSignal = signal(tasks);
  const matches = signal<Task[] | null>(null);
  // Which cards are showing a version the server has not answered for yet.
  const writing = signal<ReadonlySet<string>>(new Set<string>());

  return {
    tasks: tasksSignal,
    isError: signal(false),
    isLoading: signal(false),
    isSaving: signal(false),
    saveError: signal<string | null>(null),
    taskCount: computed(() => tasksSignal()?.length ?? 0),
    countByStatus: computed(() =>
      STATUSES.reduce(
        (counts, status) => ({
          ...counts,
          [status]: tasksSignal().filter((task) => task.status === status)
            .length,
        }),
        {} as Record<TaskStatus, number>,
      ),
    ),
    updates,
    created,
    deleted,
    queries,
    searchClears,
    matches,
    isSearching: signal(false),
    searchFailed: signal(false),
    isFiltered: computed(() => matches() !== null),
    visibleTasks: computed(() => matches() ?? tasksSignal()),
    writing,
    writingIds: computed(() => writing()),
    search: (query: string) => {
      queries.push(query);
    },
    clearSearch: () => {
      searchClears.push(searchClears.length + 1);
    },
    isCreating: signal(false),
    createError: signal<string | null>(null),
    createTask: (draft: TaskDraft) => {
      created.push(draft);

      return Promise.resolve();
    },
    getAll: () => undefined,
    getAllAsync: () => Promise.resolve(),
    reloaded: () => Promise.resolve(),
    update: (task: Task) => {
      updates.push(task);
    },
    deleteTask: (taskId: string) => {
      deleted.push(taskId);

      return Promise.resolve();
    },
    reset: () => Promise.resolve(),
  };
};

export interface FakeProjectManager extends IProjectReload {
  projects: WritableSignal<Project[]>;
  isError: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
  selectedProjectId: WritableSignal<string | null>;
  readonly selectedProject: ReturnType<typeof computed<Project | null>>;
  readonly projectCount: ReturnType<typeof computed<number>>;
  selectProject(projectId: string | null): void;
  readonly calls: string[];
  isCreating: WritableSignal<boolean>;
  createError: WritableSignal<string | null>;
  isSaving: WritableSignal<boolean>;
  saveError: WritableSignal<string | null>;
  readonly created: ProjectDraft[];
  readonly updated: Project[];
  readonly deleted: string[];
  createProject(draft: ProjectDraft): Promise<void>;
  updateProject(project: Project): Promise<void>;
  deleteProject(projectId: string): Promise<void>;
}

export const fakeProjectManager = (
  projects: Project[] = [sampleProject()],
): FakeProjectManager => {
  const projectsSignal = signal(projects);
  const selectedProjectId = signal<string | null>(null);
  const calls: string[] = [];
  const created: ProjectDraft[] = [];
  const updated: Project[] = [];
  const deleted: string[] = [];

  return {
    projects: projectsSignal,
    isError: signal(false),
    isLoading: signal(false),
    selectedProjectId,
    selectedProject: computed(
      () =>
        projectsSignal().find(
          (project) => project.id === selectedProjectId(),
        ) ?? null,
    ),
    selectProject: (projectId: string | null) => {
      selectedProjectId.set(projectId);
    },
    projectCount: computed(() => projectsSignal().length),
    calls,
    created,
    updated,
    deleted,
    isCreating: signal(false),
    createError: signal<string | null>(null),
    isSaving: signal(false),
    saveError: signal<string | null>(null),
    createProject: (draft: ProjectDraft) => {
      created.push(draft);

      return Promise.resolve();
    },
    updateProject: (project: Project) => {
      updated.push(project);

      return Promise.resolve();
    },
    deleteProject: (projectId: string) => {
      deleted.push(projectId);

      return Promise.resolve();
    },
    getAll: () => {
      calls.push('getAll');
    },
    settled: () => Promise.resolve(),
    reset: () => Promise.resolve(),
  };
};
