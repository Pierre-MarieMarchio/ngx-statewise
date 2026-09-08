import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestBed } from '@angular/core/testing';
import { Task } from '@shared/app-common/models';
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
  sampleTask({
    id: 'a',
    projectId: 'project-1',
    status: 'todo',
    title: 'First',
  }),
  sampleTask({
    id: 'a2',
    projectId: 'project-1',
    status: 'todo',
    title: 'Second',
  }),
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
    ).toEqual(['a', 'a2', 'b']);
  });

  it('groups the tasks by status across projects', async () => {
    const fixture = await mount();

    expect(
      fixture.componentInstance
        .columns()
        .map((column) => [column.id, column.tasks?.length]),
    ).toEqual([
      ['todo', 3],
      ['in-progress', 0],
      ['done', 1],
    ]);
  });

  it('keeps a task reordered inside its own column', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    const todoOf = (projectId: string): string[] =>
      component
        .getProjectFilteredTasks(
          projectId,
          component.columns().find((column) => column.id === 'todo')?.tasks ??
            [],
        )
        .map((task) => task.id);

    expect(todoOf('project-1')).toEqual(['a', 'a2']);

    const container = {
      id: 'dropList_todo_project-1',
      data: component.getProjectFilteredTasks(
        'project-1',
        component.columns().find((column) => column.id === 'todo')?.tasks ?? [],
      ),
    };

    component.onTaskDrop({
      previousContainer: container,
      container,
      previousIndex: 0,
      currentIndex: 1,
    } as unknown as CdkDragDrop<Task[]>);
    fixture.detectChanges();

    expect(todoOf('project-1')).toEqual(['a2', 'a']);
  });

  it('leaves the other projects untouched by a reorder', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    const container = {
      id: 'dropList_todo_project-1',
      data: component.getProjectFilteredTasks(
        'project-1',
        component.columns().find((column) => column.id === 'todo')?.tasks ?? [],
      ),
    };

    component.onTaskDrop({
      previousContainer: container,
      container,
      previousIndex: 0,
      currentIndex: 1,
    } as unknown as CdkDragDrop<Task[]>);
    fixture.detectChanges();

    expect(
      component
        .getProjectFilteredTasks(
          'project-2',
          component.columns().find((column) => column.id === 'todo')?.tasks ??
            [],
        )
        .map((task) => task.id),
    ).toEqual(['c']);
  });
  describe('without a pointer', () => {
    it('reports a keyboard move to its page, like a drop', async () => {
      const fixture = await mount();
      const changed: Task[] = [];
      fixture.componentInstance.taskChanged.subscribe((task) =>
        changed.push(task),
      );

      fixture.componentInstance.moveTask(TASKS[0], 1);

      expect(changed).toEqual([{ ...TASKS[0], status: 'in-progress' }]);
    });

    it('makes every card a tab stop with a name', async () => {
      const fixture = await mount();
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-kanban-card',
      );

      expect(cards.length).toBeGreaterThan(0);
      for (const card of Array.from(cards)) {
        expect(card.getAttribute('tabindex')).toBe('0');
        expect(card.getAttribute('aria-label')).toContain('arrow keys');
      }
    });
  });
});
