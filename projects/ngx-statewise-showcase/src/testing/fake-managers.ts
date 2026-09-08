import { computed, signal, WritableSignal } from '@angular/core';
import { LoginSubmit } from '@app/features/auth/models';
import { Project } from '@app/features/project/models';
import {
  IAuthManager,
  IProjectManager,
  ITaskManager,
} from '@shared/app-common/tokens';
import { STATUSES, Task, TaskStatus, User } from '@shared/app-common/models';

/**
 * The showcase reads every manager through an injection token, so a component
 * test only needs an object of the same shape. These doubles expose their
 * signals as writable ones and record the calls a component makes, which is
 * what the specs assert on.
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

export interface FakeAuthManager extends IAuthManager {
  user: WritableSignal<User | null>;
  isLoggedIn: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
  isError: WritableSignal<boolean>;
  readonly logins: LoginSubmit[];
  readonly logouts: string[];
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

export interface FakeTaskManager extends ITaskManager {
  tasks: WritableSignal<Task[] | null>;
  isError: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
  isSaving: WritableSignal<boolean>;
  readonly updates: Task[];
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

export interface FakeProjectManager extends IProjectManager {
  projects: WritableSignal<Project[] | null>;
  isError: WritableSignal<boolean>;
  isLoading: WritableSignal<boolean>;
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
    getAllAsync: () => Promise.resolve(),
    settled: () => Promise.resolve(),
    reset: () => Promise.resolve(),
  };
};
