import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import {
  AUTH_MANAGER,
  PROJECT_MANAGER,
  TASK_MANAGER,
} from '@shared/app-common/tokens';
import {
  fakeAuthManager,
  FakeAuthManager,
  fakeProjectManager,
  FakeProjectManager,
  fakeTaskManager,
  FakeTaskManager,
  sampleProject,
  sampleTask,
  sampleUser,
} from '@testing/fake-managers';
import { noticeUpdater } from '@app/features/notice/states';
import { TallyState } from '@app/features/tally/states';
import { LiveStatePageComponent } from './live-state-page.component';

describe('LiveStatePageComponent', () => {
  let fixture: ComponentFixture<LiveStatePageComponent>;
  let authManager: FakeAuthManager;
  let taskManager: FakeTaskManager;
  let projectManager: FakeProjectManager;
  let tallyState: TallyState;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const reading = (card: string, label: string): string =>
    host()
      .querySelector(`[data-card="${card}"] [data-reading="${label}"]`)
      ?.textContent?.trim() ?? '';

  const click = (label: string): void => {
    Array.from(host().querySelectorAll<HTMLButtonElement>('button'))
      .find((candidate) => candidate.textContent?.trim() === label)
      ?.click();

    fixture.detectChanges();
  };

  beforeEach(async () => {
    authManager = fakeAuthManager(sampleUser({ role: 'admin' }));
    taskManager = fakeTaskManager([sampleTask({ id: 'a', status: 'todo' })]);
    projectManager = fakeProjectManager([sampleProject()]);

    await TestBed.configureTestingModule({
      imports: [LiveStatePageComponent],
      providers: [
        provideStatewise({ updaters: [noticeUpdater] }),
        { provide: AUTH_MANAGER, useValue: authManager },
        { provide: TASK_MANAGER, useValue: taskManager },
        { provide: PROJECT_MANAGER, useValue: projectManager },
      ],
    }).compileComponents();

    tallyState = TestBed.inject(TallyState);
    tallyState.total = 0;
    tallyState.lastStep = 0;

    fixture = TestBed.createComponent(LiveStatePageComponent);
    fixture.detectChanges();
  });

  it('shows one card per state it watches', () => {
    expect(
      Array.from(host().querySelectorAll('[data-card]')).map((card) =>
        card.getAttribute('data-card'),
      ),
    ).toEqual(['auth', 'tasks', 'projects', 'notice', 'tally']);
  });

  it('reads the auth state, derived values included', () => {
    expect(reading('auth', 'user')).toBe('admin');
    expect(reading('auth', 'isAdmin')).toBe('true');
    expect(reading('auth', 'isLoggedIn')).toBe('true');
  });

  it('offers no refresh, since it holds no snapshot', () => {
    expect(
      Array.from(host().querySelectorAll('button')).map((button) =>
        button.textContent?.trim(),
      ),
    ).not.toContain('refresh');
  });

  /**
   * The point of the page: nothing is copied, so a state change reaches the
   * view without the page being asked for anything.
   */
  it('follows the auth state changing underneath it', () => {
    authManager.user.set(
      sampleUser({ userName: 'other', role: 'contributor' }),
    );
    fixture.detectChanges();

    expect(reading('auth', 'user')).toBe('other');
    expect(reading('auth', 'isAdmin')).toBe('false');
  });

  it('follows the task counts, one line per status', () => {
    expect(reading('tasks', 'taskCount')).toBe('1');
    expect(reading('tasks', 'todo')).toBe('1');
    expect(reading('tasks', 'done')).toBe('0');

    taskManager.tasks.set([
      sampleTask({ id: 'a', status: 'done' }),
      sampleTask({ id: 'b', status: 'done' }),
    ]);
    fixture.detectChanges();

    expect(reading('tasks', 'taskCount')).toBe('2');
    expect(reading('tasks', 'todo')).toBe('0');
    expect(reading('tasks', 'done')).toBe('2');
  });

  it('follows the project count', () => {
    expect(reading('projects', 'projectCount')).toBe('1');

    projectManager.projects.set(null);
    fixture.detectChanges();

    expect(reading('projects', 'projectCount')).toBe('0');
  });

  it('reports a loading task manager', () => {
    taskManager.isLoading.set(true);
    fixture.detectChanges();

    expect(reading('tasks', 'isLoading')).toBe('true');
  });

  it('raises a notice through a handle owning no updater', () => {
    expect(reading('notice', 'raisedCount')).toBe('0');

    click('raise a notice');

    expect(reading('notice', 'message')).toBe('raised from the state page');
    expect(reading('notice', 'raisedCount')).toBe('1');
  });

  it('increments the tally held in plain properties', () => {
    click('increment the tally');

    expect(tallyState.total).toBe(1);
    expect(reading('tally', 'total')).toBe('1');
  });

  it('asks the managers to reload', () => {
    let taskReloads = 0;
    let projectReloads = 0;
    taskManager.getAll = () => (taskReloads += 1) && undefined;
    projectManager.getAll = () => (projectReloads += 1) && undefined;

    click('reload the tasks');
    click('reload the projects');

    expect(taskReloads).toBe(1);
    expect(projectReloads).toBe(1);
  });
});
