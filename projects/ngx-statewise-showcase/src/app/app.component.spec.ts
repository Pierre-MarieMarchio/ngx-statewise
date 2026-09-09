import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { fakeAuthManager } from '@testing/fake-managers';
import { AppComponent } from './app.component';
import { AuthManager } from './features/auth/states/auth/auth.manager';
import { Theme, ThemeService } from './shared/ui/theme-toggle';

describe('AppComponent', () => {
  let previousBodyClass: string;

  beforeEach(() => {
    previousBodyClass = document.body.className;
  });

  afterEach(() => {
    document.body.className = previousBodyClass;
  });

  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: AuthManager, useValue: fakeAuthManager() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('renders the navigation and a router outlet', async () => {
    const fixture = await mount();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('app-nav-shell')).not.toBeNull();
    expect(fixture.componentInstance.navigationItems.length).toBeGreaterThan(0);
  });

  it('writes the theme in use onto the document body', async () => {
    const fixture = await mount();

    expect(document.body.className).toBe('dark mat-typography');

    TestBed.inject(ThemeService).setTheme(Theme.LIGHT);
    fixture.detectChanges();

    expect(document.body.className).toBe('light mat-typography');
  });
});
