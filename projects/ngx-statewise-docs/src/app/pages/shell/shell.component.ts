import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GUIDE_SECTIONS } from '../../features/guide/guide-pages';
import {
  CurrentPagePath,
  DEFAULT_LOCALE,
  LOCALE,
  LOCALES,
  uiStrings,
  type Locale,
} from '../../core/i18n';
import {
  CHANGELOG_URL,
  LIBRARY_VERSION,
  NPM_URL,
  RELEASES_URL,
  REPOSITORY_URL,
  SITE_URL,
} from '../../core/site';
import {
  DocsUiManager,
  THEME_CHOICES,
  type ThemeChoice,
} from '../../core/ui-state';
import { SearchDialogComponent } from './components/search-dialog/search-dialog.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';

/** Marks the head elements this component owns, so it can replace its own. */
const OWNED_BY_SHELL = 'data-docs-alternate';

/**
 * The chrome around every page. Routed rather than sitting above the router,
 * so it can read the `LOCALE` its route provides. The whole interface is
 * localised from that one token.
 */
@Component({
  selector: 'docs-shell',
  imports: [
    IconComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SearchDialogComponent,
  ],
  host: {
    // The palette shortcut every tool of this kind answers to. Bound on the
    // host rather than on window, so it dies with the component.
    '(document:keydown)': 'onKeydown($event)',
    '(document:keydown.escape)': 'closeNav()',
  },
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  protected readonly locale = inject(LOCALE);
  protected readonly sections = GUIDE_SECTIONS;
  protected readonly repositoryUrl = REPOSITORY_URL;
  protected readonly npmUrl = NPM_URL;
  protected readonly changelogUrl = CHANGELOG_URL;
  protected readonly releasesUrl = RELEASES_URL;
  protected readonly version = LIBRARY_VERSION;

  protected readonly text = computed(() => uiStrings(this.locale.code));

  private readonly document = inject(DOCUMENT);
  private readonly location = inject(Location);
  private readonly currentPage = inject(CurrentPagePath);
  private readonly ui = inject(DocsUiManager);

  protected readonly theme = this.ui.theme;
  protected readonly navOpen = this.ui.navOpen;

  /**
   * The landing page, which is the one that reports an empty path. It keeps the
   * sidebar like every other page, and only takes a wider shell: it has no
   * table of contents on the right to fill the slack.
   */
  protected readonly isLanding = computed(
    () => this.currentPage.path().length === 0,
  );

  /** The icon on the closed menu reflects what is painted, not what was picked:
      on `system` it shows the theme the system is currently asking for. */
  protected readonly themeIcon = computed(() =>
    this.ui.themeChoice() === 'system'
      ? ('system-theme' as const)
      : THEME_ICONS[this.ui.theme()],
  );

  protected readonly themeOptions = computed(() => {
    const text = this.text();
    const current = this.ui.themeChoice();

    return THEME_CHOICES.map((choice) => ({
      choice,
      icon: THEME_MENU_ICONS[choice],
      label: THEME_LABELS[choice](text),
      isCurrent: choice === current,
    }));
  });

  private readonly search = viewChild.required(SearchDialogComponent);

  /**
   * Every locale, each pointing at the same page it is on now. The current one
   * is included and marked: hiding it would leave nothing saying which
   * language the reader is in.
   */
  protected readonly localeOptions = computed(() =>
    LOCALES.map((candidate) => ({
      locale: candidate,
      isCurrent: candidate.code === this.locale.code,
      // Through the base href: this is a plain href, not a routerLink, so
      // nothing else would add the deployment subpath to it.
      href: this.location.prepareExternalUrl(this.pathIn(candidate)),
    })),
  );

  public constructor() {
    // The document has to say which language it is in, for assistive
    // technology and for search engines.
    effect(() => {
      this.document.documentElement.lang = this.locale.htmlLang;
    });

    effect(() => {
      this.writeAlternateLinks();
    });
  }

  protected homeLink(): string[] {
    return ['/', this.locale.code];
  }

  protected pageLink(slug: string): string[] {
    return ['/', this.locale.code, 'guide', slug];
  }

  protected openSearch(): void {
    this.search().open();
  }

  protected onKeydown(event: KeyboardEvent): void {
    // Ctrl on Windows and Linux, Cmd on a Mac, and metaKey covers the latter.
    if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.openSearch();
    }
  }

  protected chooseTheme(choice: ThemeChoice): void {
    this.ui.chooseTheme(choice);
  }

  protected toggleNav(): void {
    this.ui.toggleNav();
  }

  protected closeNav(): void {
    this.ui.closeNav();
  }

  /** The current page's path, in the given locale. */
  private pathIn(locale: Locale): string {
    const suffix = this.currentPage.path();
    const rest = suffix.length > 0 ? `/${suffix}` : '';

    return `/${locale.code}${rest}`;
  }

  /**
   * `rel="canonical"` and one `rel="alternate"` per locale, fully qualified
   * because that is what search engines expect of `hreflang`. Rewritten on
   * every navigation, since the head is shared by every page.
   */
  private writeAlternateLinks(): void {
    const head = this.document.head;

    head
      .querySelectorAll(`link[${OWNED_BY_SHELL}]`)
      .forEach((link) => link.remove());

    const add = (rel: string, href: string, hreflang?: string): void => {
      const link = this.document.createElement('link');

      link.setAttribute(OWNED_BY_SHELL, '');
      link.setAttribute('rel', rel);
      link.setAttribute('href', href);

      if (hreflang !== undefined) {
        link.setAttribute('hreflang', hreflang);
      }

      head.appendChild(link);
    };

    add('canonical', `${SITE_URL}${this.pathIn(this.locale)}`);

    for (const locale of LOCALES) {
      add('alternate', `${SITE_URL}${this.pathIn(locale)}`, locale.htmlLang);
    }

    add('alternate', `${SITE_URL}${this.pathIn(DEFAULT_LOCALE)}`, 'x-default');
  }
}

const THEME_ICONS = {
  light: 'light-mode',
  dark: 'dark-mode',
} as const;

const THEME_MENU_ICONS = {
  light: 'light-mode',
  dark: 'dark-mode',
  system: 'system-theme',
} as const;

const THEME_LABELS: Record<
  ThemeChoice,
  (text: {
    themeLight: string;
    themeDark: string;
    themeSystem: string;
  }) => string
> = {
  light: (text) => text.themeLight,
  dark: (text) => text.themeDark,
  system: (text) => text.themeSystem,
};
