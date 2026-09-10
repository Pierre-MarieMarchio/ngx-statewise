import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  fakeAuthManager,
  FakeAuthManager,
  fakeProjectReload,
  fakeTaskReload,
  sampleUser,
} from '@testing/fake-managers';
import { UserPickerComponent } from './user-picker.component';
import { PROJECT_RELOAD, TASK_RELOAD } from '@app/features/common';
import { AuthManager } from '@app/features/auth/states';

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
        { provide: AuthManager, useValue: authManager },
        // Switching user waits on both features before it lets go, so the
        // picker reaches them through the service that does the waiting.
        { provide: TASK_RELOAD, useValue: fakeTaskReload() },
        { provide: PROJECT_RELOAD, useValue: fakeProjectReload() },
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
