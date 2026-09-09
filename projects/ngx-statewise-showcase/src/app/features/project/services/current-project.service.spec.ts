import { TestBed } from '@angular/core/testing';
import { AUTH_SESSION } from '@app/features/common';
import {
  fakeAuthSession,
  fakeProjectManager,
  FakeProjectManager,
  fakeTaskManager,
  FakeTaskManager,
  sampleProject,
  sampleTask,
} from '@testing/fake-managers';
import { ProjectManager } from '../states/project/project.manager';
import { TaskManager } from '../states/task/task.manager';
import { CurrentProjectService } from './current-project.service';

const PROJECTS = [
  sampleProject({ id: 'p-1', title: 'Analytics' }),
  sampleProject({ id: 'p-2', title: 'Billing' }),
];

const TASKS = [
  sampleTask({ id: 't-1', projectId: 'p-1', status: 'todo' }),
  sampleTask({ id: 't-2', projectId: 'p-1', status: 'done' }),
  sampleTask({ id: 't-3', projectId: 'p-2', status: 'todo' }),
];

/**
 * A derivation over two states and nothing else, so the whole subject is what
 * it answers as each of them moves.
 */
describe('CurrentProjectService', () => {
  let projectManager: FakeProjectManager;
  let taskManager: FakeTaskManager;
  let current: CurrentProjectService;

  beforeEach(() => {
    projectManager = fakeProjectManager(PROJECTS);
    taskManager = fakeTaskManager(TASKS);

    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_SESSION, useValue: fakeAuthSession() },
        { provide: ProjectManager, useValue: projectManager },
        { provide: TaskManager, useValue: taskManager },
      ],
    });

    current = TestBed.inject(CurrentProjectService);
  });

  it('answers for every project until one is chosen', () => {
    expect(current.title()).toBe('All projects');
    expect(current.taskCount()).toBe(3);
    expect(current.countByStatus()).toEqual({
      todo: 2,
      'in-progress': 0,
      done: 1,
    });
  });

  it('narrows to the project that was chosen', () => {
    projectManager.selectProject('p-1');

    expect(current.title()).toBe('Analytics');
    expect(current.tasks().map((task) => task.id)).toEqual(['t-1', 't-2']);
    expect(current.countByStatus()).toEqual({
      todo: 1,
      'in-progress': 0,
      done: 1,
    });
  });

  it('follows a task as it moves, without being told', () => {
    projectManager.selectProject('p-1');
    taskManager.tasks.set([
      sampleTask({ id: 't-1', projectId: 'p-1', status: 'done' }),
    ]);

    expect(current.countByStatus().done).toBe(1);
    expect(current.countByStatus().todo).toBe(0);
  });

  /** Two narrowings compose: a search still applies inside a project. */
  it('keeps the search the manager left behind', () => {
    projectManager.selectProject('p-1');
    taskManager.matches.set([TASKS[1]!]);

    expect(current.tasks().map((task) => task.id)).toEqual(['t-2']);
  });
});
