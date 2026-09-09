import { TestBed } from '@angular/core/testing';
import { AUTH_SESSION } from '@app/features/common';
import { TaskManager } from '@app/features/project/states/task/task.manager';
import {
  fakeAuthSession,
  fakeTaskManager,
  sampleTask,
} from '@testing/fake-managers';
import { openedSampleTask, openFirstRow } from '@testing/task-table';
import { OverviewTaskListComponent } from './overview-task-list.component';

const TASKS = [sampleTask(), sampleTask({ id: 'task-2' })];

/**
 * What this panel decides is which tasks it shows and that a selection reaches
 * its caller. Which columns a role may see is `app-task-table`'s, and is
 * asserted there once rather than in each of the views that mount it.
 */
describe('OverviewTaskListComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [OverviewTaskListComponent],
      providers: [
        { provide: AUTH_SESSION, useValue: fakeAuthSession() },
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

  /** The table's action button has to reach this panel's own output. */
  it('opens a task from a named button, once', async () => {
    expect(openFirstRow(await mount())).toEqual(openedSampleTask());
  });
});
