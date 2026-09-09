import { TestBed } from '@angular/core/testing';
import {
  fakeAuthManager,
  fakeAuthSession,
  fakeProjectManager,
  FakeProjectManager,
  fakeTaskManager,
  FakeTaskManager,
  fakeTeamDirectory,
  sampleTask,
} from '@testing/fake-managers';
import { BoardPageComponent } from './board-page.component';
import { AuthManager } from '@app/features/auth/states';
import { AUTH_SESSION } from '@app/features/common';
import { TEAM_DIRECTORY } from '@app/features/project/ports';
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
        // The details panel names its assignees through the port
        // `features/project` declares and the composition answers.
        { provide: TEAM_DIRECTORY, useValue: fakeTeamDirectory() },
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

    component.selectTask(sampleTask());
    fixture.detectChanges();

    expect(component.selectedTask()?.id).toBe('task-1');
    expect(component.panelOpen()).toBe(true);

    component.closeSideNav();
    fixture.detectChanges();

    expect(component.panelOpen()).toBe(false);
  });

  /**
   * The panel used to hold a snapshot, so a card that moved — or one the
   * server refused and the rollback put back — went on being shown the way it
   * had been when it was clicked.
   */
  describe('what the panel is looking at', () => {
    it('follows the task as the state has it', async () => {
      const fixture = await mount();
      const component = fixture.componentInstance;

      component.selectTask(sampleTask());
      taskManager.tasks.set([sampleTask({ status: 'done' })]);

      expect(component.selectedTask()?.status).toBe('done');
    });

    it('shows nothing once the task is gone', async () => {
      const fixture = await mount();
      const component = fixture.componentInstance;

      component.selectTask(sampleTask());
      taskManager.tasks.set([]);

      expect(component.selectedTask()).toBeNull();
    });
  });

  it('forwards a changed task to the manager', async () => {
    const fixture = await mount();
    const changed = sampleTask({ id: 'moved', status: 'done' });

    fixture.componentInstance.onTaskChanged(changed);

    expect(taskManager.updates).toEqual([changed]);
  });

  /**
   * The one write in this application carrying more than one field: the draft
   * is merged onto the version the state holds, so what `pendingWrites` keeps
   * is the exact row a refusal has to put back.
   */
  describe('saving an edited task', () => {
    it('merges the draft onto the task the state holds', async () => {
      const fixture = await mount();
      const component = fixture.componentInstance;

      component.selectTask(sampleTask());
      component.saveTask({
        projectId: 'project-1',
        title: 'Renamed',
        description: '',
        status: 'in-progress',
        priority: 'low',
        dueDate: '',
        assignedUserIds: ['user-2'],
      });

      expect(taskManager.updates).toEqual([
        {
          ...sampleTask(),
          title: 'Renamed',
          description: '',
          status: 'in-progress',
          priority: 'low',
          dueDate: '',
          assignedUserIds: ['user-2'],
        },
      ]);
      expect(component.panel()).toBe('task');
    });

    it('has nothing to save when nothing is selected', async () => {
      const fixture = await mount();

      fixture.componentInstance.saveTask({
        projectId: 'project-1',
        title: 'Renamed',
        status: 'todo',
        priority: 'low',
      });

      expect(taskManager.updates).toEqual([]);
    });
  });

  /**
   * One panel, four things to show. Opening a form has to displace the
   * details, and picking a task has to displace the form — otherwise a single
   * panel is only a single panel by accident.
   */
  describe('the one side panel', () => {
    it('shows the task details by default', async () => {
      const fixture = await mount();
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelector('app-task-details')).not.toBeNull();
      expect(host.querySelector('app-project-form')).toBeNull();
      expect(host.querySelector('app-task-form')).toBeNull();
    });

    it('gives it over to the project form, and takes it back', async () => {
      const fixture = await mount();
      const host = fixture.nativeElement as HTMLElement;

      fixture.componentInstance.openNewProject();
      fixture.detectChanges();

      expect(host.querySelector('app-project-form')).not.toBeNull();
      expect(host.querySelector('app-task-details')).toBeNull();

      fixture.componentInstance.selectTask(sampleTask());
      fixture.detectChanges();

      expect(host.querySelector('app-task-details')).not.toBeNull();
      expect(host.querySelector('app-project-form')).toBeNull();
    });

    it('gives it over to the task form', async () => {
      const fixture = await mount();
      const host = fixture.nativeElement as HTMLElement;

      fixture.componentInstance.openNewTask();
      fixture.detectChanges();

      expect(host.querySelector('app-task-form')).not.toBeNull();
      expect(host.querySelector('app-task-details')).toBeNull();
    });

    it('gives it over to the edit form, on the selected task', async () => {
      const fixture = await mount();
      const host = fixture.nativeElement as HTMLElement;

      fixture.componentInstance.selectTask(sampleTask());
      fixture.detectChanges();

      host.querySelector<HTMLButtonElement>('.edit-btn')?.click();
      fixture.detectChanges();

      expect(host.querySelector('app-task-form')).not.toBeNull();
      expect(host.querySelector('app-task-details')).toBeNull();
      expect(host.querySelector('.panel-form-title')?.textContent?.trim()).toBe(
        'Edit task',
      );
    });

    it('holds the new-task button while there is no project to put one in', async () => {
      const fixture = await mount();
      projectManager.projects.set([]);
      fixture.detectChanges();

      const buttons = Array.from(
        (
          fixture.nativeElement as HTMLElement
        ).querySelectorAll<HTMLButtonElement>('.board-header-actions button'),
      );

      expect(buttons.map((button) => button.disabled)).toEqual([false, true]);
    });
  });
});
