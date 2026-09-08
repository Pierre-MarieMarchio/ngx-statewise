import { TestBed } from '@angular/core/testing';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import {
  fakeAuthManager,
  FakeAuthManager,
  sampleTask,
  sampleUser,
} from '@testing/fake-managers';
import { AllTaskListComponent } from './all-task-list.component';

const TASKS = [sampleTask(), sampleTask({ id: 'task-2', title: 'Second' })];

describe('AllTaskListComponent', () => {
  let authManager: FakeAuthManager;

  const mount = async () => {
    authManager = fakeAuthManager();

    await TestBed.configureTestingModule({
      imports: [AllTaskListComponent],
      providers: [{ provide: AUTH_MANAGER, useValue: authManager }],
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
