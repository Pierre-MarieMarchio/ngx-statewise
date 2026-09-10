import { TestBed } from '@angular/core/testing';
import { Task } from '../../models';
import {
  fakeTaskManager,
  fakeTeamDirectory,
  sampleTask,
} from '@testing/fake-managers';
import { TEAM_DIRECTORY } from '@app/features/project/ports';
import { TaskManager } from '@app/features/project/states/task/task.manager';
import { TaskKanbanComponent } from './task-kanban.component';
import { at } from '@testing/at';

const TASKS = [
  sampleTask({ id: 'a', status: 'todo', title: 'First' }),
  sampleTask({ id: 'a2', status: 'todo', title: 'Second' }),
  sampleTask({ id: 'b', status: 'done' }),
];

/**
 * The board itself is covered by `KanbanComponent`'s own specs. What is left
 * here is the adapting: statuses into columns, and what a move means for the
 * page above. Which tasks reach it is the page's decision now, so this one
 * only ever sees the list it is handed.
 */
describe('TaskKanbanComponent', () => {
  const mount = async (tasks: Task[] = TASKS) => {
    await TestBed.configureTestingModule({
      imports: [TaskKanbanComponent],
      providers: [
        // The card body inside it names an assignee and asks whether its own
        // write is still out.
        { provide: TEAM_DIRECTORY, useValue: fakeTeamDirectory() },
        { provide: TaskManager, useValue: fakeTaskManager(tasks) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskKanbanComponent);
    fixture.componentRef.setInput('tasks', tasks);
    fixture.detectChanges();
    return fixture;
  };

  const columnsOf = (fixture: { componentInstance: TaskKanbanComponent }) =>
    fixture.componentInstance.columns();

  it('draws one board, whatever the tasks belong to', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('app-kanban')
        .length,
    ).toBe(1);
  });

  it('lays the tasks out by status', async () => {
    const fixture = await mount();

    expect(
      columnsOf(fixture).map((column) => [
        column.id,
        column.items.map((task) => task.id),
      ]),
    ).toEqual([
      ['todo', ['a', 'a2']],
      ['in-progress', []],
      ['done', ['b']],
    ]);
  });

  /** Three empty columns say "nothing here yet" better than a sentence. */
  it('draws its columns even with nothing to put in them', async () => {
    const fixture = await mount([]);

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('app-kanban')
        .length,
    ).toBe(1);
    expect(columnsOf(fixture).map((column) => column.items.length)).toEqual([
      0, 0, 0,
    ]);
  });

  it('reports a move to the page above, in its new column', async () => {
    const fixture = await mount();
    const changed: Task[] = [];
    fixture.componentInstance.taskChanged.subscribe((task) =>
      changed.push(task),
    );

    fixture.componentInstance.onTaskMoved({
      item: at(TASKS, 0),
      from: 'todo',
      to: 'in-progress',
    });

    expect(changed).toEqual([{ ...at(TASKS, 0), status: 'in-progress' }]);
  });

  it('reports nothing for a column it cannot read as a status', async () => {
    const fixture = await mount();
    const changed: Task[] = [];
    fixture.componentInstance.taskChanged.subscribe((task) =>
      changed.push(task),
    );

    fixture.componentInstance.onTaskMoved({
      item: at(TASKS, 0),
      from: 'todo',
      to: 'nowhere',
    });

    expect(changed).toEqual([]);
  });

  describe('reordering inside one column', () => {
    const todoOf = (fixture: {
      componentInstance: TaskKanbanComponent;
    }): string[] =>
      columnsOf(fixture)
        .find((column) => column.id === 'todo')
        ?.items.map((task) => task.id) ?? [];

    it('keeps the new order', async () => {
      const fixture = await mount();

      expect(todoOf(fixture)).toEqual(['a', 'a2']);

      fixture.componentInstance.onColumnReordered({
        columnId: 'todo',
        items: [at(TASKS, 1), at(TASKS, 0)],
      });
      fixture.detectChanges();

      expect(todoOf(fixture)).toEqual(['a2', 'a']);
    });

    /** A new list of tasks drops an order that was about the old one. */
    it('forgets the order when the tasks themselves change', async () => {
      const fixture = await mount();

      fixture.componentInstance.onColumnReordered({
        columnId: 'todo',
        items: [at(TASKS, 1), at(TASKS, 0)],
      });
      fixture.detectChanges();
      expect(todoOf(fixture)).toEqual(['a2', 'a']);

      fixture.componentRef.setInput('tasks', [...TASKS]);
      fixture.detectChanges();

      expect(todoOf(fixture)).toEqual(['a', 'a2']);
    });
  });
});
