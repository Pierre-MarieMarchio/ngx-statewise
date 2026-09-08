import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { GUIDE_PAGES, findGuidePage, type GuidePage } from './guide-pages';
import { GuidePageComponent } from './guide-page.component';

function mount(page: GuidePage) {
  const fixture = TestBed.createComponent(GuidePageComponent);
  fixture.componentRef.setInput('page', page);
  fixture.detectChanges();

  return fixture;
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

function pageOrFail(slug: string): GuidePage {
  const page = findGuidePage(slug);

  if (page === undefined) {
    throw new Error(`the guide has no "${slug}" page`);
  }

  return page;
}

describe('GuidePageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuidePageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the markdown of the page it is given', () => {
    const host = mount(pageOrFail('effects')).nativeElement as HTMLElement;

    expect(host.querySelector('.guide__body h1')?.textContent).toBe('Effects');
    expect(
      host.querySelectorAll('.guide__body pre code').length,
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

  it('titles the document after the page', () => {
    mount(pageOrFail('effects'));

    expect(TestBed.inject(Title).getTitle()).toBe('Effects — ngx-statewise');
  });

  it('offers no previous link on the first page, and no next on the last', () => {
    const first = mount(GUIDE_PAGES[0]).nativeElement as HTMLElement;

    expect(first.querySelector('.guide__pager-link--previous')).toBeNull();
    expect(first.querySelector('.guide__pager-link--next')).not.toBeNull();

    const last = mount(GUIDE_PAGES[GUIDE_PAGES.length - 1])
      .nativeElement as HTMLElement;

    expect(last.querySelector('.guide__pager-link--previous')).not.toBeNull();
    expect(last.querySelector('.guide__pager-link--next')).toBeNull();
  });

  it('hands a cross-page link from the markdown to the router', () => {
    const fixture = mount(pageOrFail('migration'));
    const navigate = spyOnNavigation();

    const host = fixture.nativeElement as HTMLElement;
    const link = host.querySelector<HTMLAnchorElement>(
      '.guide__body a[href^="/guide/"]',
    );

    expect(link).not.toBeNull();
    link?.click();

    expect(navigate).toHaveBeenCalledWith(
      '/guide/updaters#dispatching-through-the-right-manager',
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
});
