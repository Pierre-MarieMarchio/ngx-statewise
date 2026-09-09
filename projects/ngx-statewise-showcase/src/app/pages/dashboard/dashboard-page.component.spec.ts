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
  sampleTask,
} from '@testing/fake-managers';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        { provide: AUTH_MANAGER, useValue: fakeAuthManager() },
        { provide: TASK_MANAGER, useValue: fakeTaskManager([sampleTask()]) },
        { provide: PROJECT_MANAGER, useValue: fakeProjectManager() },
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
