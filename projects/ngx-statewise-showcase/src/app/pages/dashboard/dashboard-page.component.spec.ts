import { TestBed } from '@angular/core/testing';
import {
  fakeAuthManager,
  fakeAuthSession,
  fakeProjectReload,
  fakeProjectManager,
  fakeTaskManager,
  fakeTaskReload,
  sampleTask,
} from '@testing/fake-managers';
import { DashboardPageComponent } from './dashboard-page.component';
import { AuthManager } from '@app/features/auth/states';
import {
  AUTH_SESSION,
  PROJECT_RELOAD,
  TASK_RELOAD,
} from '@app/features/common';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import { TaskManager } from '@app/features/project/states/task/task.manager';

describe('DashboardPageComponent', () => {
  const mount = async () => {
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
        { provide: TaskManager, useValue: fakeTaskManager([sampleTask()]) },
        { provide: ProjectManager, useValue: fakeProjectManager() },
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

    component.selectTask(sampleTask({ id: 'picked' }));
    fixture.detectChanges();

    expect(component.selectedTask()?.id).toBe('picked');
    expect(component.dashboardPanel.sidenav.opened).toBe(true);

    component.closeSideNav();
    fixture.detectChanges();

    expect(component.dashboardPanel.sidenav.opened).toBe(false);
  });
});
