import { TestBed } from '@angular/core/testing';
import { AUTH_MANAGER, TASK_MANAGER } from '@shared/app-common/tokens';
import {
  fakeAuthManager,
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
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renders the task list, the kanban and the user picker', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('app-dashboard-task-list')).not.toBeNull();
    expect(host.querySelector('app-dashboard-kanban')).not.toBeNull();
    expect(host.querySelector('app-dashboard-user-picker')).not.toBeNull();
  });

  it('opens the panel on the task it was given and closes it again', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.selectedTask()).toBeNull();

    component.selectTask(sampleTask({ id: 'picked' }));
    fixture.detectChanges();

    expect(component.selectedTask()?.id).toBe('picked');
    expect(component.dashboardPanel.sidenav.opened).toBeTrue();

    component.closeSideNav();
    fixture.detectChanges();

    expect(component.dashboardPanel.sidenav.opened).toBeFalse();
  });
});
