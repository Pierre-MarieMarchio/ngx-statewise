import { TestBed } from '@angular/core/testing';
import { PROJECT_MANAGER, TASK_MANAGER } from '@shared/app-common/tokens';
import {
  fakeProjectManager,
  fakeTaskManager,
  sampleProject,
  sampleTask,
} from '@testing/fake-managers';
import { TaskKanbanComponent } from './task-kanban.component';

const PROJECTS = [
  sampleProject(),
  sampleProject({ id: 'project-2', title: 'Customer Portal', color: 'green' }),
];

const TASKS = [
  sampleTask({ id: 'a', projectId: 'project-1', status: 'todo' }),
  sampleTask({ id: 'b', projectId: 'project-1', status: 'done' }),
  sampleTask({ id: 'c', projectId: 'project-2', status: 'todo' }),
];

describe('TaskKanbanComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [TaskKanbanComponent],
      providers: [
        { provide: TASK_MANAGER, useValue: fakeTaskManager(TASKS) },
        { provide: PROJECT_MANAGER, useValue: fakeProjectManager(PROJECTS) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskKanbanComponent);
    fixture.componentRef.setInput('tasks', TASKS);
    fixture.detectChanges();
    return fixture;
  };

  it('renders one panel per project', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        'mat-expansion-panel',
      ).length,
    ).toBe(PROJECTS.length);
  });

  it('scopes each drop list to a status and a project', async () => {
    const fixture = await mount();

    expect(
      fixture.componentInstance.getConnectedDropListIds('project-2'),
    ).toEqual([
      'dropList_todo_project-2',
      'dropList_in-progress_project-2',
      'dropList_done_project-2',
    ]);
  });

  it('keeps only the tasks of the project it lists', async () => {
    const fixture = await mount();

    expect(
      fixture.componentInstance
        .getProjectFilteredTasks('project-1', TASKS)
        .map((task) => task.id),
    ).toEqual(['a', 'b']);
  });

  it('groups the tasks by status across projects', async () => {
    const fixture = await mount();

    expect(
      fixture.componentInstance
        .columns()
        .map((column) => [column.id, column.tasks?.length]),
    ).toEqual([
      ['todo', 2],
      ['in-progress', 0],
      ['done', 1],
    ]);
  });
});
