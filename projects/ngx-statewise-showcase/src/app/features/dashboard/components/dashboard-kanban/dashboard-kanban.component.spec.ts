import { TestBed } from '@angular/core/testing';
import { TASK_MANAGER } from '@shared/app-common/tokens';
import {
  fakeTaskManager,
  FakeTaskManager,
  sampleTask,
} from '@testing/fake-managers';
import { DashboardKanbanComponent } from './dashboard-kanban.component';

const TASKS = [
  sampleTask({ id: 'a', status: 'todo' }),
  sampleTask({ id: 'b', status: 'in-progress' }),
  sampleTask({ id: 'c', status: 'done' }),
  sampleTask({ id: 'd', status: 'todo' }),
];

/**
 * The board itself is covered by `KanbanComponent`'s own specs. What is left
 * here is the adapting: which columns the tasks fall into, and what a move
 * means for the manager.
 */
describe('DashboardKanbanComponent', () => {
  let taskManager: FakeTaskManager;

  const mount = async () => {
    taskManager = fakeTaskManager(TASKS);

    await TestBed.configureTestingModule({
      imports: [DashboardKanbanComponent],
      providers: [{ provide: TASK_MANAGER, useValue: taskManager }],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardKanbanComponent);
    fixture.detectChanges();

    return fixture;
  };

  it('builds one column per status, in order', async () => {
    const fixture = await mount();

    expect(
      fixture.componentInstance
        .columns()
        .map((column) => [column.id, column.items.length]),
    ).toEqual([
      ['todo', 2],
      ['in-progress', 1],
      ['done', 1],
    ]);
  });

  it('names each column for whoever cannot see it', async () => {
    const fixture = await mount();

    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          '[role="list"]',
        ),
      ).map((column) => column.getAttribute('aria-label')),
    ).toEqual(['todo items', 'in-progress items', 'done items']);
  });

  it('says so when the manager reports no task', async () => {
    const fixture = await mount();
    taskManager.tasks.set([]);
    fixture.detectChanges();

    expect(fixture.componentInstance.isEmpty()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No task to show.',
    );
  });

  it('updates the task through the manager when it moves', async () => {
    const fixture = await mount();

    fixture.componentInstance.onTaskMoved({
      item: TASKS[0],
      from: 'todo',
      to: 'done',
    });

    expect(taskManager.updates).toEqual([{ ...TASKS[0], status: 'done' }]);
  });

  /** A column id the board does not recognise is not a status to write. */
  it('writes nothing for a column it cannot read as a status', async () => {
    const fixture = await mount();

    fixture.componentInstance.onTaskMoved({
      item: TASKS[0],
      from: 'todo',
      to: 'nowhere',
    });

    expect(taskManager.updates).toEqual([]);
  });

  it('colours a card by its priority', async () => {
    const fixture = await mount();

    expect(
      fixture.componentInstance.cardTypeFor(sampleTask({ priority: 'high' })),
    ).toBe('high');
  });
});
