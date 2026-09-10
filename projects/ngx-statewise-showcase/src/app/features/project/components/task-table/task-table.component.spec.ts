import { TestBed } from '@angular/core/testing';
import { AUTH_SESSION } from '@app/features/common';
import { TEAM_DIRECTORY } from '@app/features/project/ports';
import {
  fakeAuthSession,
  FakeAuthSession,
  sampleTask,
  fakeTeamDirectory,
  sampleUser,
} from '@testing/fake-managers';
import { openedSampleTask, openFirstRow } from '@testing/task-table';
import { TaskTableComponent } from './task-table.component';

const TASKS = [sampleTask(), sampleTask({ id: 'task-2', title: 'Second' })];

/** The headers every role sees, before the one only an admin does. */
const READS = ['Title', 'Status', 'Priority', 'Due date', 'Assigned to'];

describe('TaskTableComponent', () => {
  let authManager: FakeAuthSession;

  const mount = async (
    inputs: Readonly<Record<string, unknown>> = { tasks: TASKS },
  ) => {
    authManager = fakeAuthSession();

    await TestBed.configureTestingModule({
      imports: [TaskTableComponent],
      providers: [
        { provide: AUTH_SESSION, useValue: authManager },
        { provide: TEAM_DIRECTORY, useValue: fakeTeamDirectory() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskTableComponent);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return fixture;
  };

  const headers = (host: HTMLElement): string[] =>
    Array.from(host.querySelectorAll<HTMLElement>('th[mat-header-cell]')).map(
      (cell) => cell.textContent?.trim() ?? '',
    );

  const widths = (host: HTMLElement): (string | null)[] =>
    Array.from(host.querySelectorAll<HTMLElement>('th[mat-header-cell]')).map(
      (cell) => cell.style.width || null,
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
      ...READS,
      'Organisation',
      'Open',
    ]);
  });

  it('hides the organisation column from a contributor', async () => {
    const fixture = await mount();
    authManager.user.set(sampleUser({ role: 'contributor' }));
    fixture.detectChanges();

    expect(headers(fixture.nativeElement as HTMLElement)).toEqual([
      ...READS,
      'Open',
    ]);
  });

  it('hides it while no user is known at all', async () => {
    const fixture = await mount();
    authManager.user.set(null);
    fixture.detectChanges();

    expect(headers(fixture.nativeElement as HTMLElement)).toEqual([
      ...READS,
      'Open',
    ]);
  });

  /**
   * The one way to open a task, mouse and keyboard alike. The shared column's
   * spec holds the rest of the button's behaviour.
   */
  it('opens a task from a named button, once', async () => {
    expect(openFirstRow(await mount())).toEqual(openedSampleTask());
  });

  /** A press anywhere else on a row selects nothing at all. */
  it('says nothing when the row itself is pressed', async () => {
    const fixture = await mount();
    const selected: string[] = [];
    fixture.componentInstance.taskSelected.subscribe((task) =>
      selected.push(task.id),
    );

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('tr[mat-row]')
      ?.click();

    expect(selected).toEqual([]);
  });

  describe('what it says with nothing in it', () => {
    it('stands in for the table rather than rendering an empty one', async () => {
      const fixture = await mount({ tasks: [] });
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelector('table')).toBeNull();
      expect(host.querySelector('.empty-state')?.textContent?.trim()).toBe(
        'No tasks yet. Create one to start.',
      );
    });

    it('takes the caller wording when there is a better one', async () => {
      const fixture = await mount({
        tasks: [],
        emptyMessage: 'No task is assigned to you.',
      });

      expect(
        (fixture.nativeElement as HTMLElement)
          .querySelector('.empty-state')
          ?.textContent?.trim(),
      ).toBe('No task is assigned to you.');
    });
  });

  describe('capping the columns for an accordion', () => {
    it('leaves them alone by default', async () => {
      const fixture = await mount();

      expect(widths(fixture.nativeElement as HTMLElement)).toEqual(
        [...READS, 'Organisation', 'Open'].map(() => null),
      );
    });

    /** The title keeps the slack the others give up: it identifies the row. */
    it('caps every column but the title', async () => {
      const fixture = await mount({ tasks: TASKS, capped: true });

      expect(widths(fixture.nativeElement as HTMLElement)).toEqual([
        null,
        '200px',
        '200px',
        '200px',
        '200px',
        '200px',
        null,
      ]);
    });
  });
});
