import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { Location } from '@angular/common';
import { DomSanitizer, Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { GUIDE_PAGES, type GuidePage } from './guide-pages';
import { renderGuide } from './markdown';

@Component({
  selector: 'docs-guide-page',
  imports: [RouterLink],
  templateUrl: './guide-page.component.html',
  styleUrl: './guide-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidePageComponent {
  /** Bound from the route's `data` by `withComponentInputBinding()`. */
  public readonly page = input.required<GuidePage>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly rendered = computed(() =>
    renderGuide(this.page().markdown, (path) =>
      this.location.prepareExternalUrl(path),
    ),
  );

  protected readonly headings = computed(() => this.rendered().headings);

  /**
   * Angular's sanitizer drops `id` attributes, which are exactly what the
   * heading anchors and the table of contents are made of. The markdown is
   * repository content compiled into the bundle, never user input, so the
   * value is trusted here rather than rendered without its anchors.
   */
  protected readonly html = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.rendered().html),
  );

  private readonly index = computed(() =>
    GUIDE_PAGES.findIndex((page) => page.slug === this.page().slug),
  );

  protected readonly previous = computed(() => pageAt(this.index() - 1));
  protected readonly next = computed(() => pageAt(this.index() + 1));

  public constructor() {
    effect(() => {
      const page = this.page();

      // "Why ngx-statewise" already names the library; suffixing it would
      // repeat it in the tab.
      this.title.setTitle(
        page.title.includes('ngx-statewise')
          ? page.title
          : `${page.title} — ngx-statewise`,
      );
      this.meta.updateTag({ name: 'description', content: page.summary });
    });
  }

  /**
   * The guide's cross-page links come out of markdown as plain anchors, so
   * they would reload the whole document. Anything inside the site is handed
   * to the router instead; everything else is left to the browser.
   */
  protected onContentClick(event: MouseEvent): void {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const anchor = (event.target as Element | null)?.closest('a');

    if (!anchor || anchor.origin !== this.document.location.origin) {
      return;
    }

    event.preventDefault();
    // `normalize` takes the deployment base href back off, which is what turns
    // the href into a router URL again.
    void this.router.navigateByUrl(
      this.location.normalize(anchor.pathname + anchor.hash),
    );
  }
}

/** `GUIDE_PAGES.at()` would wrap a negative index round to the last page. */
function pageAt(index: number): GuidePage | undefined {
  return index >= 0 && index < GUIDE_PAGES.length
    ? GUIDE_PAGES[index]
    : undefined;
}
