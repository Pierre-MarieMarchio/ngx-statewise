import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { LOCALE, findLocale, type LocaleCode } from '../../core/i18n';
import {
  GUIDE_PAGES,
  findGuidePage,
  guideContent,
  type GuidePage,
} from '../../features/guide/guide-pages';
import { GuidePageComponent } from './guide-page.component';
import { at } from '../../../testing/at';

function configure(code: LocaleCode = 'en') {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [GuidePageComponent],
    providers: [
      provideRouter([]),
      { provide: LOCALE, useValue: findLocale(code) },
    ],
  });
}

function mount(page: GuidePage) {
  const fixture = TestBed.createComponent(GuidePageComponent);
  fixture.componentRef.setInput('page', page);
  fixture.detectChanges();

  return fixture;
}

function pageOrFail(slug: string): GuidePage {
  const page = findGuidePage(slug);

  if (page === undefined) {
    throw new Error(`the guide has no "${slug}" page`);
  }

  return page;
}

/**
 * The router's own initial navigation lands on the spy otherwise, and the
 * assertion is about what the click did, not about how the fixture started.
 */
function spyOnNavigation() {
  const navigate = vi
    .spyOn(TestBed.inject(Router), 'navigateByUrl')
    .mockResolvedValue(true);
  navigate.mockClear();

  return navigate;
}

describe('GuidePageComponent', () => {
  beforeEach(() => {
    configure();
  });

  it('renders the markdown of the page it is given', () => {
    const host = mount(pageOrFail('effects')).nativeElement as HTMLElement;

    expect(host.querySelector('.guide__body h1')?.textContent).toContain(
      'Effects',
    );
    expect(
      host.querySelectorAll('.guide__body .code-block').length,
    ).toBeGreaterThan(0);
  });

  /**
   * Angular's sanitizer strips `id`, so a plain `[innerHTML]` would render the
   * guide without a single anchor and quietly break the table of contents and
   * every cross-page link. The component trusts the HTML for that reason; this
   * fails the moment it stops.
   */
  it('keeps the heading anchors in the rendered DOM', () => {
    const host = mount(pageOrFail('effects')).nativeElement as HTMLElement;

    const withId = host.querySelectorAll(
      '.guide__body h2[id], .guide__body h3[id]',
    );
    const total = host.querySelectorAll('.guide__body h2, .guide__body h3');

    expect(total.length).toBeGreaterThan(0);
    expect(withId.length).toBe(total.length);
  });

  it('lists those same anchors in the table of contents', () => {
    const host = mount(pageOrFail('effects')).nativeElement as HTMLElement;

    const headings = host.querySelectorAll(
      '.guide__body h2[id], .guide__body h3[id]',
    );
    const entries = host.querySelectorAll('.toc__link');

    expect(entries.length).toBe(headings.length);
  });

  it('shows the section the page belongs to, as a breadcrumb', () => {
    const host = mount(pageOrFail('effects')).nativeElement as HTMLElement;

    expect(host.querySelector('.breadcrumb')?.textContent).toContain(
      'Key concepts',
    );
  });

  it('links to the markdown behind the page, in the locale it served', () => {
    const host = mount(pageOrFail('effects')).nativeElement as HTMLElement;
    const href = host.querySelector('.edit-link')?.getAttribute('href');

    expect(href).toContain('/guide/content/en/effects.md');
  });

  it('titles the document after the page', () => {
    mount(pageOrFail('effects'));

    expect(TestBed.inject(Title).getTitle()).toBe('Effects — ngx-statewise');
  });

  it('offers no previous link on the first page, and no next on the last', () => {
    const first = mount(at(GUIDE_PAGES, 0)).nativeElement as HTMLElement;

    expect(first.querySelector('.pager__link--previous')).toBeNull();
    expect(first.querySelector('.pager__link--next')).not.toBeNull();

    const last = mount(at(GUIDE_PAGES, GUIDE_PAGES.length - 1))
      .nativeElement as HTMLElement;

    expect(last.querySelector('.pager__link--previous')).not.toBeNull();
    expect(last.querySelector('.pager__link--next')).toBeNull();
  });

  it('hands a cross-page link from the markdown to the router', () => {
    const fixture = mount(pageOrFail('migration'));
    const navigate = spyOnNavigation();

    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector<HTMLAnchorElement>(
      '.guide__body a[href^="/en/guide/"]',
    );

    expect(link).not.toBeNull();
    link?.click();

    expect(navigate).toHaveBeenCalledWith(
      '/en/guide/updaters#dispatching-through-the-right-manager',
    );
  });

  it('leaves an external link to the browser', () => {
    const fixture = mount(pageOrFail('effects'));
    const navigate = spyOnNavigation();

    const host = fixture.nativeElement as HTMLElement;
    const external = document.createElement('a');
    external.href = 'https://example.com/';
    host.querySelector('.guide__body')?.appendChild(external);

    external.click();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('copies a code block to the clipboard, and confirms it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    const fixture = mount(pageOrFail('effects'));
    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector<HTMLButtonElement>('[data-copy-code]');
    const code = host.querySelector('.code-block code')?.textContent;

    button?.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith(code);
    expect(button?.classList.contains('code-block__copy--copied')).toBe(true);

    vi.unstubAllGlobals();
  });

  describe('in a locale with no translation', () => {
    beforeEach(() => {
      configure('fr');
    });

    it('says so, and serves the default locale instead', () => {
      const page = pageOrFail('effects');
      const host = mount(page).nativeElement as HTMLElement;

      expect(guideContent(page, 'fr').isFallback).toBe(true);
      expect(host.querySelector('.notice')?.textContent).toContain(
        "n'est pas encore traduite",
      );
      // The article says which language it is actually in, whatever the page is.
      expect(host.querySelector('.guide__body')?.getAttribute('lang')).toBe(
        'en',
      );
    });

    it('still localises the interface around it', () => {
      const host = mount(pageOrFail('effects')).nativeElement as HTMLElement;

      expect(host.querySelector('.toc__title')?.textContent).toContain(
        'Sur cette page',
      );
      expect(host.querySelector('.pager__label')?.textContent).toContain(
        'Précédent',
      );
    });
  });
});
