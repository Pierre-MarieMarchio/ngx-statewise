import { TestBed } from '@angular/core/testing';
import { Task } from '../../models';
import {
  fakeProjectManager,
  sampleProject,
  sampleTask,
} from '@testing/fake-managers';
import { TaskKanbanComponent } from './task-kanban.component';
import { ProjectManager } from '@app/features/project/states/project/project.manager';

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

/**
 * The board itself is covered by `KanbanComponent`'s own specs. What is left
 * here is the adapting: one board per project, and what a move means for the
 * page above.
 */
/** The boards are keyed by project now, so a spec picks the one it means. */
const columnsOf = (
  fixture: { componentInstance: TaskKanbanComponent },
  projectId: string,
) =>
  fixture.componentInstance
    .boards()
    .find((board) => board.project.id === projectId)?.columns ?? [];

describe('TaskKanbanComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [TaskKanbanComponent],
      providers: [
        { provide: ProjectManager, useValue: fakeProjectManager(PROJECTS) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskKanbanComponent);
    fixture.componentRef.setInput('tasks', TASKS);
    fixture.detectChanges();

    return fixture;
  };

  it('renders one board per project', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('app-kanban')
        .length,
    ).toBe(PROJECTS.length);
  });

  it('builds the columns of one project only', async () => {
    const fixture = await mount();

    expect(
      columnsOf(fixture, 'project-1').map((column) => [
        column.id,
        column.items.map((task) => task.id),
      ]),
    ).toEqual([
      ['todo', ['a', 'a2']],
      ['in-progress', []],
      ['done', ['b']],
    ]);
  });

  it('says so when there is no project to draw a board for', async () => {
    await TestBed.configureTestingModule({
      imports: [TaskKanbanComponent],
      providers: [
        { provide: ProjectManager, useValue: fakeProjectManager([]) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskKanbanComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No project, so no board to draw.',
    );
  });

  it('reports a move to the page above, in its new column', async () => {
    const fixture = await mount();
    const changed: Task[] = [];
    fixture.componentInstance.taskChanged.subscribe((task) =>
      changed.push(task),
    );

    fixture.componentInstance.onTaskMoved({
      item: TASKS[0],
      from: 'todo',
      to: 'in-progress',
    });

    expect(changed).toEqual([{ ...TASKS[0], status: 'in-progress' }]);
  });

  it('reports nothing for a column it cannot read as a status', async () => {
    const fixture = await mount();
    const changed: Task[] = [];
    fixture.componentInstance.taskChanged.subscribe((task) =>
      changed.push(task),
    );

    fixture.componentInstance.onTaskMoved({
      item: TASKS[0],
      from: 'todo',
      to: 'nowhere',
    });

    expect(changed).toEqual([]);
  });

  describe('reordering inside one column', () => {
    const todoOf = (
      fixture: { componentInstance: TaskKanbanComponent },
      projectId: string,
    ): string[] =>
      columnsOf(fixture, projectId)
        .find((column) => column.id === 'todo')
        ?.items.map((task) => task.id) ?? [];

    it('keeps the new order', async () => {
      const fixture = await mount();

      expect(todoOf(fixture, 'project-1')).toEqual(['a', 'a2']);

      fixture.componentInstance.onColumnReordered({
        columnId: 'todo',
        items: [TASKS[1], TASKS[0]],
      });
      fixture.detectChanges();

      expect(todoOf(fixture, 'project-1')).toEqual(['a2', 'a']);
    });

    it('leaves the other projects where they were', async () => {
      const fixture = await mount();

      fixture.componentInstance.onColumnReordered({
        columnId: 'todo',
        items: [TASKS[1], TASKS[0]],
      });
      fixture.detectChanges();

      expect(todoOf(fixture, 'project-2')).toEqual(['c']);
    });
  });
});
