import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import { fakeAuthManager, FakeAuthManager } from '@testing/fake-managers';
import { NavigationComponent } from './navigation.component';

const ITEMS = [
  { icon: 'Dashboard', label: 'Dashboard', route: 'home' },
  { icon: 'Task_Alt', label: 'Task', route: 'task' },
];

describe('NavigationComponent', () => {
  let authManager: FakeAuthManager;

  const mount = async () => {
    authManager = fakeAuthManager();

    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [
        provideRouter([]),
        { provide: AUTH_MANAGER, useValue: authManager },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NavigationComponent);
    fixture.componentRef.setInput('navigationitems', ITEMS);
    fixture.detectChanges();
    return fixture;
  };

  it('lists one link per navigation item while logged in', async () => {
    const fixture = await mount();

    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('a[mat-item]'),
      ).length,
    ).toBe(ITEMS.length + 1);
  });

  it('hides the navigation items and the logout while logged out', async () => {
    const fixture = await mount();
    authManager.isLoggedIn.set(false);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('a[mat-item]').length).toBe(1);
    expect(host.querySelector('.footer-groupe-button')).toBeNull();
  });

  it('asks the manager to log out', async () => {
    const fixture = await mount();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.footer-groupe-button button')
      ?.click();

    expect(authManager.logouts.length).toBe(1);
  });
});
