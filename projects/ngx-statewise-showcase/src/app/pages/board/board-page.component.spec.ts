import { TestBed } from '@angular/core/testing';
import {
  fakeAuthManager,
  fakeAuthSession,
  fakeProjectManager,
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

  const mount = async () => {
    taskManager = fakeTaskManager([sampleTask()]);

    await TestBed.configureTestingModule({
      imports: [BoardPageComponent],
      providers: [
        { provide: AuthManager, useValue: fakeAuthManager() },
        // The lists this page mounts read the session through the kernel's
        // port, not through the manager the page itself injects.
        { provide: AUTH_SESSION, useValue: fakeAuthSession() },
        { provide: TaskManager, useValue: taskManager },
        { provide: ProjectManager, useValue: fakeProjectManager() },
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
