import { TestBed } from '@angular/core/testing';
import {
  fakeAuthManager,
  fakeAuthSession,
  fakeProjectManager,
  FakeProjectManager,
  fakeTaskManager,
  FakeTaskManager,
  sampleTask,
} from '@testing/fake-managers';
import { BoardPageComponent } from './board-page.component';
import { AuthManager } from '@app/features/auth/states';
import { AUTH_SESSION } from '@app/features/common';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import { TaskManager } from '@app/features/project/states/task/task.manager';

describe('BoardPageComponent', () => {
  let taskManager: FakeTaskManager;
  let projectManager: FakeProjectManager;

  const mount = async () => {
    taskManager = fakeTaskManager([sampleTask()]);
    projectManager = fakeProjectManager();

    await TestBed.configureTestingModule({
      imports: [BoardPageComponent],
      providers: [
        { provide: AuthManager, useValue: fakeAuthManager() },
        // The lists this page mounts read the session through the kernel's
        // port, not through the manager the page itself injects.
        { provide: AUTH_SESSION, useValue: fakeAuthSession() },
        { provide: TaskManager, useValue: taskManager },
        { provide: ProjectManager, useValue: projectManager },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BoardPageComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('offers one tab per task view', async () => {
    const fixture = await mount();

    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          '.mat-mdc-tab .mdc-tab__text-label',
        ),
      ).map((label) => label.textContent?.replace(/\s+/g, ' ').trim()),
    ).toEqual([
      'view_kanban Kanban',
      'view_list All Tasks',
      'person My Tasks',
      'construction Projects',
    ]);
  });

  /**
   * Two of the four tabs group by project, so a project load that failed has to
   * be visible here. It used to be neither shown nor clearable.
   */
  it('reports a failed project load, apart from the tasks', async () => {
    const fixture = await mount();
    projectManager.isError.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(
      Array.from(host.querySelectorAll('.data-state-error-message')).map(
        (message) => message.textContent?.trim(),
      ),
    ).toEqual(['The projects could not be loaded.']);
  });

  it('asks the project manager to reload from its own alert', async () => {
    const fixture = await mount();
    projectManager.isError.set(true);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.data-state-error button')
      ?.click();

    expect(projectManager.calls).toEqual(['getAll']);
  });

  it('opens the panel on the task it was given', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.selectTask(sampleTask({ id: 'picked' }));
    fixture.detectChanges();

    expect(component.selectedTask()?.id).toBe('picked');
    expect(component.taskPanel.sidenav.opened).toBe(true);

    component.closeSideNav();
    fixture.detectChanges();

    expect(component.taskPanel.sidenav.opened).toBe(false);
  });

  it('forwards a changed task to the manager', async () => {
    const fixture = await mount();
    const changed = sampleTask({ id: 'moved', status: 'done' });

    fixture.componentInstance.onTaskChanged(changed);

    expect(taskManager.updates).toEqual([changed]);
  });
});
