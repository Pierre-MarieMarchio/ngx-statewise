import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { fakeAuthManager, FakeAuthManager } from '@testing/fake-managers';
import { AuthManager } from '@app/features/auth/states';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let authManager: FakeAuthManager;

  const mount = async () => {
    authManager = fakeAuthManager();

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([]),
        { provide: AuthManager, useValue: authManager },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renders the login form', async () => {
    const fixture = await mount();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-login-form'),
    ).not.toBeNull();
  });

  it('hands the submitted credentials to the manager', async () => {
    const fixture = await mount();

    fixture.componentInstance.onFormSubmit({
      email: 'admin@admin',
      password: 'admin',
    });

    expect(authManager.logins).toEqual([
      { email: 'admin@admin', password: 'admin' },
    ]);
  });
});
