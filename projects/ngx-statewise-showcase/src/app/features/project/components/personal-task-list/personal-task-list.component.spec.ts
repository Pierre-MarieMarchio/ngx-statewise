import { TestBed } from '@angular/core/testing';
import { AUTH_SESSION } from '@app/features/common';
import { TEAM_DIRECTORY } from '@app/features/project/ports';
import {
  fakeAuthSession,
  FakeAuthSession,
  fakeTeamDirectory,
  sampleTask,
} from '@testing/fake-managers';
import { openedSampleTask, openFirstRow } from '@testing/task-table';
import { PersonalTaskListComponent } from './personal-task-list.component';

const TASKS = [
  sampleTask({ id: 'mine', assignedUserIds: ['user-1'] }),
  sampleTask({ id: 'someone-else', assignedUserIds: ['user-9'] }),
  sampleTask({ id: 'unassigned', assignedUserIds: undefined }),
];

/**
 * What this view decides is what "mine" means. The table it mounts holds the
 * columns and the role that filters them, and its own spec asserts those.
 */
describe('PersonalTaskListComponent', () => {
  let authManager: FakeAuthSession;

  const mount = async () => {
    authManager = fakeAuthSession();

    await TestBed.configureTestingModule({
      imports: [PersonalTaskListComponent],
      providers: [
        { provide: AUTH_SESSION, useValue: authManager },
        { provide: TEAM_DIRECTORY, useValue: fakeTeamDirectory() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonalTaskListComponent);
    fixture.componentRef.setInput('allTasks', TASKS);
    fixture.detectChanges();
    return fixture;
  };

  it('keeps only the tasks assigned to the current user', async () => {
    const fixture = await mount();

    expect(fixture.componentInstance.tasks().map((task) => task.id)).toEqual([
      'mine',
    ]);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('tr[mat-row]')
        .length,
    ).toBe(1);
  });

  it('lists nothing while no user is known', async () => {
    const fixture = await mount();
    authManager.user.set(null);
    fixture.detectChanges();

    expect(fixture.componentInstance.tasks()).toEqual([]);
  });

  /** And says so in its own words rather than the table's default. */
  it('says nothing is assigned rather than nothing exists', async () => {
    const fixture = await mount();
    authManager.user.set(null);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.empty-state')
        ?.textContent?.trim(),
    ).toBe('No task is assigned to you.');
  });

  it('opens a task from a named button, once', async () => {
    expect(openFirstRow(await mount())).toEqual(openedSampleTask('mine'));
  });
});
