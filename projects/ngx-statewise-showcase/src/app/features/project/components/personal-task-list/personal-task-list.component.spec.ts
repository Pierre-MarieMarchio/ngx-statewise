import { TestBed } from '@angular/core/testing';
import {
  fakeAuthSession,
  FakeAuthSession,
  sampleTask,
} from '@testing/fake-managers';
import { PersonalTaskListComponent } from './personal-task-list.component';
import { AUTH_SESSION } from '@app/features/common';

const TASKS = [
  sampleTask({ id: 'mine', assignedUserIds: ['user-1'] }),
  sampleTask({ id: 'someone-else', assignedUserIds: ['user-9'] }),
  sampleTask({ id: 'unassigned', assignedUserIds: undefined }),
];

describe('PersonalTaskListComponent', () => {
  let authManager: FakeAuthSession;

  const mount = async () => {
    authManager = fakeAuthSession();

    await TestBed.configureTestingModule({
      imports: [PersonalTaskListComponent],
      providers: [{ provide: AUTH_SESSION, useValue: authManager }],
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

  /**
   * It used to show a fixed three, alone among the four tables in filtering
   * nothing. It follows the role now, like its siblings.
   */
  it('offers the organisation column to an admin, and not to anyone else', async () => {
    const fixture = await mount();
    const headers = () =>
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
          'th[mat-header-cell]',
        ),
      ).map((cell) => cell.textContent?.trim());

    expect(headers()).toEqual([
      'Title',
      'Status',
      'Priority',
      'Organisation',
      'Open',
    ]);

    authManager.user.set({ userId: 'user-1', role: 'member' });
    fixture.detectChanges();

    expect(headers()).toEqual(['Title', 'Status', 'Priority', 'Open']);
  });

  /**
   * The row click is a mouse shortcut. This button is the path a keyboard has,
   * and stopping the propagation is what keeps one press to one selection.
   */
  it('opens a task from a named button, once', async () => {
    const fixture = await mount();
    const selected: string[] = [];
    fixture.componentInstance.taskSelected.subscribe((task) =>
      selected.push(task.id),
    );

    const open = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('td.open-cell button');

    expect(open?.getAttribute('aria-label')).toBe(
      'Open Wire the showcase to a smoke test',
    );

    open?.click();

    expect(selected).toEqual(['mine']);
  });
});
