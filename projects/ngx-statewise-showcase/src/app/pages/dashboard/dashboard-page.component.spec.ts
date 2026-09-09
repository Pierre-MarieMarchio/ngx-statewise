import { TestBed } from '@angular/core/testing';
import {
  fakeAuthManager,
  fakeAuthSession,
  fakeProjectReload,
  fakeProjectManager,
  fakeTaskManager,
  FakeTaskManager,
  fakeTaskReload,
  fakeTeamDirectory,
  sampleTask,
} from '@testing/fake-managers';
import { DashboardPageComponent } from './dashboard-page.component';
import { AuthManager } from '@app/features/auth/states';
import {
  AUTH_SESSION,
  PROJECT_RELOAD,
  TASK_RELOAD,
} from '@app/features/common';
import { TEAM_DIRECTORY } from '@app/features/project/ports';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import { TaskManager } from '@app/features/project/states/task/task.manager';

describe('DashboardPageComponent', () => {
  let taskManager: FakeTaskManager;

  const mount = async () => {
    taskManager = fakeTaskManager([sampleTask()]);

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        { provide: AuthManager, useValue: fakeAuthManager() },
        // The lists this page mounts read the session through the kernel's
        // port, not through the manager the page itself injects.
        { provide: AUTH_SESSION, useValue: fakeAuthSession() },
        // …and the user picker it mounts drives UserSwitchService, which
        // waits on both reload ports.
        { provide: TASK_RELOAD, useValue: fakeTaskReload() },
        { provide: PROJECT_RELOAD, useValue: fakeProjectReload() },
        { provide: TaskManager, useValue: taskManager },
        { provide: ProjectManager, useValue: fakeProjectManager() },
        // The details panel names its assignees through the port
        // `features/project` declares and the composition answers.
        { provide: TEAM_DIRECTORY, useValue: fakeTeamDirectory() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renders the task list, the kanban and the user picker', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('app-overview-task-list')).not.toBeNull();
    expect(host.querySelector('app-overview-kanban')).not.toBeNull();
    expect(host.querySelector('app-user-picker')).not.toBeNull();
  });

  it('opens the panel on the task it was given and closes it again', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.selectedTask()).toBeNull();

    component.selectTask(sampleTask());
    fixture.detectChanges();

    expect(component.selectedTask()?.id).toBe('task-1');
    expect(component.panelOpen()).toBe(true);

    component.closeSideNav();
    fixture.detectChanges();

    expect(component.panelOpen()).toBe(false);
  });

  /** Derived, like the board's: a card dragged here changed under the panel. */
  it('follows the selected task as the state has it', async () => {
    const fixture = await mount();

    fixture.componentInstance.selectTask(sampleTask());
    taskManager.tasks.set([sampleTask({ status: 'done' })]);

    expect(fixture.componentInstance.selectedTask()?.status).toBe('done');
  });
});
