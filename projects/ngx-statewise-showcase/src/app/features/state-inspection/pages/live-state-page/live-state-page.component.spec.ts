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
// Imported for its side effect as much as its value: `defineUpdater` records
// the action types it claims when its module loads, which is what lets the
// engine recognise a misrouted dispatch of one of them.
import { taskUpdater } from '@app/features/project/states/task/task.updater';
import { noticeUpdater } from '@app/features/state-inspection/states';
import { LiveStatePageComponent } from './live-state-page.component';

describe('LiveStatePageComponent', () => {
  let fixture: ComponentFixture<LiveStatePageComponent>;
  let authManager: FakeAuthManager;
  let taskManager: FakeTaskManager;
  let projectManager: FakeProjectManager;

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

    fixture = TestBed.createComponent(LiveStatePageComponent);
    fixture.detectChanges();
  });

  it('shows one readout per manager it watches', () => {
    expect(
      Array.from(host().querySelectorAll('[data-card]')).map((card) =>
        card.getAttribute('data-card'),
      ),
    ).toEqual(['auth', 'tasks', 'projects']);
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
  describe('a dispatch sent to the wrong manager', () => {
    it('shows nothing failed until something does', () => {
      expect(host().textContent).toContain('Nothing has failed yet.');
    });

    /**
     * The check has existed for a while and the showcase had no executable
     * demonstration of it — only prose and a code literal on the docs page.
     */
    it('refuses it and says which manager owns the action', () => {
      expect(taskUpdater.handlers.size).toBeGreaterThan(0);

      click('dispatch a misrouted action');

      const shown = host().querySelector('[data-card="errors"]')?.textContent;

      expect(shown).toContain('No updater in scope for "TASK_REQUEST"');
      expect(host().textContent).not.toContain('Nothing has failed yet.');
    });

    it('lets the reader clear what it collected', () => {
      click('dispatch a misrouted action');
      click('clear failures');

      expect(host().textContent).toContain('Nothing has failed yet.');
    });
  });
});
