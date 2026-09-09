import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AUTH_MANAGER,
  PROJECT_MANAGER,
  TASK_MANAGER,
} from '@shared/app-common/tokens';
import {
  fakeAuthManager,
  FakeAuthManager,
  fakeProjectManager,
  fakeTaskManager,
  sampleUser,
} from '@testing/fake-managers';
import { UserPickerComponent } from './user-picker.component';

describe('UserPickerComponent', () => {
  let fixture: ComponentFixture<UserPickerComponent>;
  let authManager: FakeAuthManager;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const checkedLabel = (): string =>
    host()
      .querySelector('mat-button-toggle.mat-button-toggle-checked')
      ?.textContent?.trim() ?? '';

  const clickToggle = (value: string): void => {
    host()
      .querySelector<HTMLButtonElement>(
        `mat-button-toggle[value="${value}"] button`,
      )
      ?.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    authManager = fakeAuthManager(sampleUser({ userName: 'admin' }));

    await TestBed.configureTestingModule({
      imports: [UserPickerComponent],
      providers: [
        { provide: AUTH_MANAGER, useValue: authManager },
        // Switching user waits on both features before it lets go, so the
        // picker reaches them through the service that does the waiting.
        { provide: TASK_MANAGER, useValue: fakeTaskManager() },
        { provide: PROJECT_MANAGER, useValue: fakeProjectManager() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserPickerComponent);
    fixture.detectChanges();
  });

  it('offers one toggle per demo user', () => {
    expect(
      Array.from(host().querySelectorAll('mat-button-toggle')).map((toggle) =>
        toggle.textContent?.trim(),
      ),
    ).toEqual(['Admin', 'User 1', 'User 2']);
  });

  it('checks the toggle of the user the manager reports', () => {
    expect(checkedLabel()).toBe('Admin');
  });

  it('follows the manager when the user changes underneath it', () => {
    authManager.user.set(sampleUser({ userName: 'user2' }));
    fixture.detectChanges();

    expect(checkedLabel()).toBe('User 2');
  });

  it('checks nothing while no user is known', () => {
    authManager.user.set(null);
    fixture.detectChanges();

    expect(checkedLabel()).toBe('');
  });

  it('logs in as the picked demo user', () => {
    clickToggle('user1');

    expect(authManager.logins).toEqual([
      { email: 'user1@user', password: 'user1' },
    ]);
  });

  it('ignores a value that matches no demo user', () => {
    fixture.componentInstance.onSelectionChange({
      value: 'stranger',
    } as never);

    expect(authManager.logins).toEqual([]);
  });
});
