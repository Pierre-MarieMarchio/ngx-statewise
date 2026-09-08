import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { drainEffects, provideStatewiseTesting } from 'ngx-statewise/testing';
import { GUIDE_PAGES, GUIDE_SECTIONS } from '../guide/guide-pages';
import {
  CurrentPagePath,
  LOCALES,
  LOCALE,
  findLocale,
  type LocaleCode,
} from '../i18n';
import { DocsUiEffect, THEME_CLASSES, docsUiUpdater } from '../ui-state';
import { ShellComponent } from './shell.component';

function configure(code: LocaleCode = 'en') {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ShellComponent],
    providers: [
      provideRouter([]),
      { provide: LOCALE, useValue: findLocale(code) },
      provideStatewiseTesting({
        effects: [DocsUiEffect],
        updaters: [docsUiUpdater],
      }),
    ],
  });
}

/**
 * The shell wraps a guide page unless told otherwise. The landing page is the
 * one that reports an empty path, and it is the one that has no sidebar, so
 * every other test mounts as though a guide page were open.
 */
function mount(path = 'guide/introduction') {
  TestBed.inject(CurrentPagePath).path.set(path);

  const fixture = TestBed.createComponent(ShellComponent);
  fixture.detectChanges();

  return fixture;
}

describe('ShellComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(...THEME_CLASSES);
    configure();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(...THEME_CLASSES);
    document.head
      .querySelectorAll('link[data-docs-alternate]')
      .forEach((link) => link.remove());
  });

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

  it('offers the three theme choices, and marks the current one', () => {
    const host = mount().nativeElement as HTMLElement;
    const items = host.querySelectorAll('#theme-menu .menu__item');

    expect(items.length).toBe(3);
    expect([...items].map((item) => item.textContent?.trim())).toEqual([
      'Light',
      'Dark',
      'System',
    ]);
    // Nothing stored, so the default choice is system.
    expect(
      host.querySelector('#theme-menu [aria-pressed="true"]')?.textContent,
    ).toContain('System');
  });

  it('writes the picked theme onto the document', async () => {
    const fixture = mount();
    const host = fixture.nativeElement as HTMLElement;
    const light = [
      ...host.querySelectorAll<HTMLButtonElement>('#theme-menu .menu__item'),
    ].find((item) => item.textContent?.includes('Light'));

    light?.click();
    await drainEffects();
    fixture.detectChanges();

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
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

  it('leaves the guide sidebar out of the landing page', () => {
    // The landing page lists every guide page itself, so the sidebar beside it
    // would be the same links twice on one screen.
    const host = mount('').nativeElement as HTMLElement;

    expect(host.querySelector('.sidebar')).toBeNull();
    expect(host.querySelector('.header__nav-toggle')).toBeNull();
    expect(host.querySelector('.layout--no-nav')).not.toBeNull();
  });

  it('offers every locale, and says which one is being read', () => {
    const host = mount('guide/effects').nativeElement as HTMLElement;
    const options = host.querySelectorAll('#language-menu .menu__item');

    // Every locale, not only the alternates: hiding the current one leaves
    // nothing saying which language the page is in.
    expect(options.length).toBe(LOCALES.length);

    const current = host.querySelector('#language-menu [aria-current="true"]');

    expect(current?.textContent).toContain('English');

    const alternate = host.querySelector<HTMLAnchorElement>(
      '#language-menu .menu__item[hreflang="fr"]',
    );

    expect(alternate?.getAttribute('href')).toBe('/fr/guide/effects');
  });

  it('declares a canonical URL and one alternate per locale, plus x-default', () => {
    mount('guide/effects');

    const owned = document.head.querySelectorAll('link[data-docs-alternate]');
    const alternates = document.head.querySelectorAll(
      'link[data-docs-alternate][rel="alternate"]',
    );

    expect(owned.length).toBe(LOCALES.length + 2);
    expect(alternates.length).toBe(LOCALES.length + 1);
    expect(
      document.head
        .querySelector('link[data-docs-alternate][rel="canonical"]')
        ?.getAttribute('href'),
    ).toContain('/en/guide/effects');
    expect(
      document.head
        .querySelector('link[hreflang="x-default"]')
        ?.getAttribute('href'),
    ).toContain('/en/guide/effects');
  });

  it('replaces its own head links rather than piling them up', () => {
    const fixture = mount('guide/effects');

    TestBed.inject(CurrentPagePath).path.set('guide/managers');
    fixture.detectChanges();

    const owned = document.head.querySelectorAll('link[data-docs-alternate]');

    expect(owned.length).toBe(LOCALES.length + 2);
    expect(
      document.head
        .querySelector('link[data-docs-alternate][rel="canonical"]')
        ?.getAttribute('href'),
    ).toContain('/en/guide/managers');
  });

  describe('in French', () => {
    beforeEach(() => {
      configure('fr');
    });

    it('localises the navigation and marks the document as French', () => {
      const host = mount().nativeElement as HTMLElement;

      expect(document.documentElement.lang).toBe('fr');
      expect(host.querySelector('.sidebar__section')?.textContent).toContain(
        'Vue d’ensemble',
      );
      expect(host.querySelector('.skip-link')?.textContent).toContain(
        'Aller au contenu',
      );
    });
  });
});
