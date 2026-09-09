import { TestBed } from '@angular/core/testing';
import {
  fakeAuthSession,
  FakeAuthSession,
  sampleTask,
  sampleUser,
} from '@testing/fake-managers';
import { openedSampleTask, openFirstRow } from '@testing/task-table';
import { AllTaskListComponent } from './all-task-list.component';
import { AUTH_SESSION } from '@app/features/common';

const TASKS = [sampleTask(), sampleTask({ id: 'task-2', title: 'Second' })];

describe('AllTaskListComponent', () => {
  let authManager: FakeAuthSession;

  const mount = async () => {
    authManager = fakeAuthSession();

    await TestBed.configureTestingModule({
      imports: [AllTaskListComponent],
      providers: [{ provide: AUTH_SESSION, useValue: authManager }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AllTaskListComponent);
    fixture.componentRef.setInput('tasks', TASKS);
    fixture.detectChanges();
    return fixture;
  };

  const headers = (host: HTMLElement): string[] =>
    Array.from(host.querySelectorAll<HTMLElement>('th[mat-header-cell]')).map(
      (cell) => cell.textContent?.trim() ?? '',
    );

  it('renders one row per task', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('tr[mat-row]')
        .length,
    ).toBe(TASKS.length);
  });

  it('shows the organisation column to an admin', async () => {
    const fixture = await mount();

    expect(headers(fixture.nativeElement as HTMLElement)).toEqual([
      'Title',
      'Status',
      'Priority',
      'Organisation',
      'Open',
    ]);
  });

  it('hides the organisation column from a contributor', async () => {
    const fixture = await mount();
    authManager.user.set(sampleUser({ role: 'contributor' }));
    fixture.detectChanges();

    expect(headers(fixture.nativeElement as HTMLElement)).toEqual([
      'Title',
      'Status',
      'Priority',
      'Open',
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
