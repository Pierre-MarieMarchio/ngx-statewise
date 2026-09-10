import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  type ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { DomSanitizer, Meta, Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { CurrentPagePath, LOCALE, uiStrings } from '../../core/i18n';
import { calloutLabels } from '../../features/guide/callout-labels';
import { REPOSITORY_URL } from '../../core/site';
import {
  GUIDE_PAGES,
  GUIDE_SECTIONS,
  guideContent,
  type GuidePage,
} from '../../features/guide/guide-pages';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { renderGuide } from '../../features/guide/markdown';

/** How long the copy button stays in its confirmed state. */
const COPIED_FEEDBACK_MS = 1600;

@Component({
  selector: 'docs-guide-page',
  imports: [IconComponent, RouterLink],
  templateUrl: './guide-page.component.html',
  styleUrl: './guide-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidePageComponent {
  /** Bound from the route's `data` by `withComponentInputBinding()`. */
  public readonly page = input.required<GuidePage>();

  protected readonly locale = inject(LOCALE);
  protected readonly text = computed(() => uiStrings(this.locale.code));

  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly currentPage = inject(CurrentPagePath);

  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  protected readonly content = computed(() =>
    guideContent(this.page(), this.locale.code),
  );

  private readonly rendered = computed(() => {
    const text = this.text();

    return renderGuide(this.content().markdown, {
      toExternalUrl: (path) =>
        this.location.prepareExternalUrl(`/${this.locale.code}${path}`),
      copyCodeLabel: text.copyCode,
      headingLinkLabel: text.onThisPage,
      calloutLabels: calloutLabels(this.locale.code),
      codeRegionLabel: text.codeRegion,
      preferLabel: text.preferLabel,
      avoidLabel: text.avoidLabel,
      tableRegionLabel: text.tableRegion,
    });
  });

  protected readonly headings = computed(() => this.rendered().headings);

  /**
   * Angular's sanitizer drops `id` attributes, which are exactly what the
   * heading anchors and the table of contents are made of. The markdown is
   * repository content compiled into the bundle, never user input, so the
   * value is trusted here rather than rendered without its anchors.
   */
  protected readonly html = computed(
    () => this.sanitizer.bypassSecurityTrustHtml(this.rendered().html), // NOSONAR — answered in the paragraph above
  );

  /** The heading currently under the top of the viewport, if any. */
  protected readonly activeHeading = signal<string | null>(null);

  /** Read out by the live region: the confirmation the pop does not carry. */
  protected readonly announcement = signal('');

  protected readonly section = computed(() =>
    GUIDE_SECTIONS.find((section) =>
      section.pages.some((page) => page.slug === this.page().slug),
    ),
  );

  private readonly index = computed(() =>
    GUIDE_PAGES.findIndex((page) => page.slug === this.page().slug),
  );

  protected readonly previous = computed(() => pageAt(this.index() - 1));
  protected readonly next = computed(() => pageAt(this.index() + 1));

  /** Where the markdown behind this page lives, in the locale being shown. */
  protected readonly editUrl = computed(
    () =>
      `${REPOSITORY_URL}/blob/dev/projects/ngx-statewise-docs/src/app/features/guide/content/${this.content().locale}/${this.page().slug}.md`,
  );

  public constructor() {
    // Tells the shell which page it is wrapping, so the language switcher
    // can point at this page in the other locale.
    effect(() => {
      this.currentPage.path.set(`guide/${this.page().slug}`);
    });

    effect(() => {
      const page = this.page();
      const code = this.locale.code;
      const title = page.title[code];

      // "Why ngx-statewise" already names the library; suffixing it would
      // repeat it in the tab.
      this.title.setTitle(
        title.includes('ngx-statewise') ? title : `${title} — ngx-statewise`,
      );
      this.meta.updateTag({
        name: 'description',
        content: page.summary[code],
      });
    });

    // The delegation the rendered markdown needs, registered rather than
    // declared: the article is a container, and a `(click)` on it in the
    // template reads as a mouse-only handler on something that is not a
    // control. What it actually serves are the links and copy buttons inside
    // the injected markup, and both of those the keyboard already activates.
    afterRenderEffect((onCleanup) => {
      const root = this.body().nativeElement;
      const onClick = (event: Event): void => {
        this.onContentClick(event as MouseEvent);
      };

      root.addEventListener('click', onClick);
      onCleanup(() => {
        root.removeEventListener('click', onClick);
      });
    });

    // After-render hooks do not run while prerendering, so the observer is
    // browser-only without asking the platform.
    afterRenderEffect((onCleanup) => {
      this.rendered();

      const root = this.body().nativeElement;
      const headings = [
        ...root.querySelectorAll<HTMLElement>('h2[id], h3[id]'),
      ];

      if (headings.length === 0) {
        this.activeHeading.set(null);
        return;
      }

      // Clear of the line an anchor jump lands on: sitting exactly on it makes
      // sub-pixel scrolling flip the marker in and out.
      const top = headerHeight(root) + 16;

      const observer = new IntersectionObserver(
        (entries) => {
          // IntersectionObserver does not promise document order, so several
          // headings crossing in one callback could otherwise elect the wrong
          // one. The lowest heading still above the band is the current
          // section.
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort(
              (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
            );

          const lowest = visible.at(-1);

          if (lowest) {
            this.activeHeading.set(lowest.target.id);
            return;
          }

          // Above the first heading there is no current section; leaving the
          // marker where it was would point at one already left behind.
          const first = headings[0];

          if (first && first.getBoundingClientRect().top > top) {
            this.activeHeading.set(null);
          }
        },
        { rootMargin: `-${String(top)}px 0px -70% 0px`, threshold: 0 },
      );

      headings.forEach((heading) => observer.observe(heading));
      onCleanup(() => observer.disconnect());
    });
  }

  protected pageLink(slug: string): string[] {
    return ['/', this.locale.code, 'guide', slug];
  }

  protected homeLink(): string[] {
    return ['/', this.locale.code];
  }

  /**
   * The guide's links and copy buttons come out of markdown as plain markup,
   * so there is no component to bind to. The page listens once, here.
   */
  private onContentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const copy = target?.closest('[data-copy-code]');

    if (copy !== null && copy !== undefined) {
      void this.copyCode(copy);
      return;
    }

    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const anchor = target?.closest('a');

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

  /**
   * The button lives in injected markup, so its confirmed state is a class on
   * the element rather than a binding.
   */
  private async copyCode(button: Element): Promise<void> {
    const code = button
      .closest('.code-block')
      ?.querySelector('code')?.textContent;

    if (code === null || code === undefined) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Denied permission, or an insecure origin. Nothing to confirm.
      return;
    }

    const text = this.text();

    button.classList.add('code-block__copy--copied');
    button.setAttribute('title', text.codeCopied);
    button.setAttribute('aria-label', text.codeCopied);
    this.announcement.set(text.codeCopied);

    setTimeout(() => {
      button.classList.remove('code-block__copy--copied');
      button.setAttribute('title', text.copyCode);
      button.setAttribute('aria-label', text.copyCode);
      this.announcement.set('');
    }, COPIED_FEEDBACK_MS);
  }
}

/**
 * The sticky header's height, read from the token rather than duplicated as a
 * literal — the scroll-spy band and `scroll-margin-top` have to agree.
 */
function headerHeight(element: Element): number {
  const value = getComputedStyle(element).getPropertyValue('--header-height');
  const rem = Number.parseFloat(value);

  return Number.isFinite(rem) ? rem * 16 : 48;
}

/** `GUIDE_PAGES.at()` would wrap a negative index round to the last page. */
function pageAt(index: number): GuidePage | undefined {
  return index >= 0 && index < GUIDE_PAGES.length
    ? GUIDE_PAGES[index]
    : undefined;
}
