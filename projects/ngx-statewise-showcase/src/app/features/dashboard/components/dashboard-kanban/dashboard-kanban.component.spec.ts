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

  it('renders one drop list per status', async () => {
    const fixture = await mount();

    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          '.dashboard-kanban-task-column',
        ),
      ).map((column) => column.id),
    ).toEqual(['dropList_todo', 'dropList_in-progress', 'dropList_done']);
  });

  it('groups the tasks of the manager by status', async () => {
    const fixture = await mount();

    expect(
      fixture.componentInstance
        .columns()
        .map((column) => [column.id, column.tasks?.length]),
    ).toEqual([
      ['todo', 2],
      ['in-progress', 1],
      ['done', 1],
    ]);
  });

  it('connects every drop list to all the others', async () => {
    const fixture = await mount();

    expect(fixture.componentInstance.getConnectedDropListIds()).toEqual([
      'dropList_todo',
      'dropList_in-progress',
      'dropList_done',
    ]);
  });

  it('empties itself when the manager reports no task', async () => {
    const fixture = await mount();
    taskManager.tasks.set([]);
    fixture.detectChanges();

    expect(
      fixture.componentInstance
        .columns()
        .every((column) => column.tasks?.length === 0),
    ).toBe(true);
  });
});
