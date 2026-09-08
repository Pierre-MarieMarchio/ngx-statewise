import { TestBed } from '@angular/core/testing';
import { AUTH_MANAGER, TASK_MANAGER } from '@shared/app-common/tokens';
import {
  fakeAuthManager,
  FakeAuthManager,
  fakeTaskManager,
  sampleTask,
  sampleUser,
} from '@testing/fake-managers';
import { DashboardTaskListComponent } from './dashboard-task-list.component';

const TASKS = [sampleTask(), sampleTask({ id: 'task-2' })];

describe('DashboardTaskListComponent', () => {
  let authManager: FakeAuthManager;

  const mount = async () => {
    authManager = fakeAuthManager();

    await TestBed.configureTestingModule({
      imports: [DashboardTaskListComponent],
      providers: [
        { provide: AUTH_MANAGER, useValue: authManager },
        { provide: TASK_MANAGER, useValue: fakeTaskManager(TASKS) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardTaskListComponent);
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
});
