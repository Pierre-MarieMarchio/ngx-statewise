import { TestBed } from '@angular/core/testing';
import {
  AUTH_MANAGER,
  PROJECT_MANAGER,
  TASK_MANAGER,
} from '@shared/app-common/tokens';
import {
  fakeAuthManager,
  fakeProjectManager,
  fakeTaskManager,
  FakeTaskManager,
  sampleTask,
} from '@testing/fake-managers';
import { TaskPageComponent } from './task-page.component';

describe('TaskPageComponent', () => {
  let taskManager: FakeTaskManager;

  const mount = async () => {
    taskManager = fakeTaskManager([sampleTask()]);

    await TestBed.configureTestingModule({
      imports: [TaskPageComponent],
      providers: [
        { provide: AUTH_MANAGER, useValue: fakeAuthManager() },
        { provide: TASK_MANAGER, useValue: taskManager },
        { provide: PROJECT_MANAGER, useValue: fakeProjectManager() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskPageComponent);
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
    expect(component.taskPanel.sidenav.opened).toBeTrue();

    component.closeSideNav();
    fixture.detectChanges();

    expect(component.taskPanel.sidenav.opened).toBeFalse();
  });

  it('forwards a changed task to the manager', async () => {
    const fixture = await mount();
    const changed = sampleTask({ id: 'moved', status: 'done' });

    fixture.componentInstance.onTaskChanged(changed);

    expect(taskManager.updates).toEqual([changed]);
  });
});
