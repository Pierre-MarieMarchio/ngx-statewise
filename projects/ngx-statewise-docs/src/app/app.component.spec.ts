import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { drainEffects, provideStatewiseTesting } from 'ngx-statewise/testing';
import { AppComponent } from './app.component';
import { GUIDE_PAGES, GUIDE_SECTIONS } from './guide/guide-pages';
import { DocsUiEffect, THEME_ATTRIBUTE, docsUiUpdater } from './ui-state';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute(THEME_ATTRIBUTE);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideStatewiseTesting({
          effects: [DocsUiEffect],
          updaters: [docsUiUpdater],
        }),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  });

  const mount = () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    return fixture;
  };

  it('lists every guide page in the sidebar, under its section', () => {
    const host = mount().nativeElement as HTMLElement;

    expect(host.querySelectorAll('.sidebar__link').length).toBe(
      GUIDE_PAGES.length,
    );
    expect(host.querySelectorAll('.sidebar__section').length).toBe(
      GUIDE_SECTIONS.length,
    );
  });

  it('renders a router outlet and the skip link', () => {
    const host = mount().nativeElement as HTMLElement;

    expect(host.querySelector('router-outlet')).not.toBeNull();
    expect(host.querySelector('.skip-link')?.getAttribute('href')).toBe(
      '#main',
    );
  });

  it('switches theme from the header, all the way to the document', async () => {
    const fixture = mount();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('.header__theme')?.click();
    await drainEffects();
    fixture.detectChanges();

    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(
      'light',
    );
  });

  it('opens the navigation drawer from the header button', () => {
    const fixture = mount();
    const host = fixture.nativeElement as HTMLElement;
    const toggle = host.querySelector<HTMLButtonElement>('.header__nav-toggle');

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');

    toggle?.click();
    fixture.detectChanges();

    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('.layout--nav-open')).not.toBeNull();
  });
});
