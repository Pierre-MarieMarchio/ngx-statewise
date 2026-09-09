import { TestBed } from '@angular/core/testing';
import {
  fakeAuthSession,
  FakeAuthSession,
  fakeTaskManager,
  sampleTask,
  sampleUser,
} from '@testing/fake-managers';
import { openedSampleTask, openFirstRow } from '@testing/task-table';
import { OverviewTaskListComponent } from './overview-task-list.component';
import { AUTH_SESSION } from '@app/features/common';
import { TaskManager } from '@app/features/project/states/task/task.manager';

const TASKS = [sampleTask(), sampleTask({ id: 'task-2' })];

describe('OverviewTaskListComponent', () => {
  let authManager: FakeAuthSession;

  const mount = async () => {
    authManager = fakeAuthSession();

    await TestBed.configureTestingModule({
      imports: [OverviewTaskListComponent],
      providers: [
        { provide: AUTH_SESSION, useValue: authManager },
        { provide: TaskManager, useValue: fakeTaskManager(TASKS) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OverviewTaskListComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('lists the tasks the manager holds', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('tr[mat-row]')
        .length,
    ).toBe(TASKS.length);
  });

  it('drops the organisation column for a contributor', async () => {
    const fixture = await mount();
    authManager.user.set(sampleUser({ role: 'contributor' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.displayedColumns()).toEqual([
      'title',
      'status',
      'priority',
      'open',
    ]);
  });

  it('emits the task of the clicked row', async () => {
    const fixture = await mount();
    const selected: string[] = [];
    fixture.componentInstance.taskSelected.subscribe((task) =>
      selected.push(task.id),
    );

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('tr[mat-row]')
      ?.click();

    expect(selected).toEqual(['task-1']);
  });

  /**
   * The row click is a mouse shortcut. This button is the path a keyboard has,
   * and the shared column's spec holds the rest of its behaviour.
   */
  it('opens a task from a named button, once', async () => {
    expect(openFirstRow(await mount())).toEqual(openedSampleTask());
  });
});
