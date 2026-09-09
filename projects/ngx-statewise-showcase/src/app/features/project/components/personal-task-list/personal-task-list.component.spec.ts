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

  it('never offers the organisation column', async () => {
    const fixture = await mount();

    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
          'th[mat-header-cell]',
        ),
      ).map((cell) => cell.textContent?.trim()),
    ).toEqual(['Title', 'Status', 'Priority']);
  });
});
