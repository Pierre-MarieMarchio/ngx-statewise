import { computed, signal, WritableSignal } from '@angular/core';
import { LoginSubmit, User } from '@app/features/auth/models';
import {
  IAuthSession,
  IProjectReload,
  ITaskReload,
  SessionUser,
} from '@app/features/common';
import {
  Project,
  STATUSES,
  Task,
  TaskStatus,
} from '@app/features/project/models';

/**
 * Two families, because the showcase crosses two kinds of boundary.
 *
 * **Narrow doubles** stand in for a port of the shared kernel: three members
 * at most, provided against its token, and used by the feature on the far side
 * of the boundary. They are deliberately as small as the port — a spec that
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
  tasks: WritableSignal<Task[] | null>;
  isError: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
  isSaving: WritableSignal<boolean>;
  readonly taskCount: ReturnType<typeof computed<number>>;
  readonly countByStatus: ReturnType<
    typeof computed<Record<TaskStatus, number>>
  >;
  readonly updates: Task[];
  getAllAsync(): Promise<void>;
  update(task: Task): void;
}

export const fakeTaskManager = (
  tasks: Task[] | null = [sampleTask()],
): FakeTaskManager => {
  const updates: Task[] = [];

  const tasksSignal = signal(tasks);

  return {
    tasks: tasksSignal,
    isError: signal(false),
    isLoading: signal(false),
    isSaving: signal(false),
    taskCount: computed(() => tasksSignal()?.length ?? 0),
    countByStatus: computed(() =>
      STATUSES.reduce(
        (counts, status) => ({
          ...counts,
          [status]: (tasksSignal() ?? []).filter(
            (task) => task.status === status,
          ).length,
        }),
        {} as Record<TaskStatus, number>,
      ),
    ),
    updates,
    getAll: () => undefined,
    getAllAsync: () => Promise.resolve(),
    reloaded: () => Promise.resolve(),
    update: (task: Task) => {
      updates.push(task);
    },
    reset: () => Promise.resolve(),
  };
};

export interface FakeProjectManager extends IProjectReload {
  projects: WritableSignal<Project[] | null>;
  isError: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
  readonly projectCount: ReturnType<typeof computed<number>>;
}

export const fakeProjectManager = (
  projects: Project[] | null = [sampleProject()],
): FakeProjectManager => {
  const projectsSignal = signal(projects);

  return {
    projects: projectsSignal,
    isError: signal(false),
    isLoading: signal(false),
    projectCount: computed(() => projectsSignal()?.length ?? 0),
    getAll: () => undefined,
    settled: () => Promise.resolve(),
    reset: () => Promise.resolve(),
  };
};
