import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginSubmit } from '@app/features/auth/models';
import { User } from '@shared/app-common/models';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import { DashboardUserPickerComponent } from './dashboard-user-picker.component';

const userNamed = (userName: string): User => ({
  userId: 'u-1',
  userName,
  email: `${userName}@example`,
  role: 'contributor',
  organizationId: 'org-1',
});

describe('DashboardUserPickerComponent', () => {
  let fixture: ComponentFixture<DashboardUserPickerComponent>;
  let user: ReturnType<typeof signal<User | null>>;
  let logins: LoginSubmit[];

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
    user = signal<User | null>(userNamed('admin'));
    logins = [];

    await TestBed.configureTestingModule({
      imports: [DashboardUserPickerComponent],
      providers: [
        {
          provide: AUTH_MANAGER,
          useValue: {
            user,
            isLoggedIn: signal(true),
            isLoading: signal(false),
            login: (credential: LoginSubmit) => {
              logins.push(credential);
              return Promise.resolve();
            },
            authenticate: () => Promise.resolve(),
            logout: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardUserPickerComponent);
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
    user.set(userNamed('user2'));
    fixture.detectChanges();

    expect(checkedLabel()).toBe('User 2');
  });

  it('checks nothing while no user is known', () => {
    user.set(null);
    fixture.detectChanges();

    expect(checkedLabel()).toBe('');
  });

  it('logs in as the picked demo user', () => {
    clickToggle('user1');

    expect(logins).toEqual([{ email: 'user1@user', password: 'user1' }]);
  });

  it('ignores a value that matches no demo user', () => {
    fixture.componentInstance.onSelectionChange({
      value: 'stranger',
    } as never);

    expect(logins).toEqual([]);
  });
});
