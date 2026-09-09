import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { GUIDE_SECTIONS } from '../guide/guide-pages';
import { CurrentPagePath, LOCALE, uiStrings } from '../i18n';
import { LIBRARY_GZIP_KB, REPOSITORY_URL } from '../site';

@Component({
  selector: 'docs-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly locale = inject(LOCALE);
  protected readonly sections = GUIDE_SECTIONS;
  protected readonly repositoryUrl = REPOSITORY_URL;

  protected readonly text = computed(() => uiStrings(this.locale.code));

  /**
   * The one measurable promise the library can make, in the reader's own
   * notation: 2.7 in English, 2,7 in French. The number lives in site.ts and
   * `npm run verify:size` fails the build if it stops being true.
   */
  protected readonly sizeSentence = computed(() =>
    this.text().homeSize.replace(
      '{size}',
      new Intl.NumberFormat(this.locale.htmlLang).format(LIBRARY_GZIP_KB),
    ),
  );

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly currentPage = inject(CurrentPagePath);

  public constructor() {
    // Tells the shell which page it is wrapping, so the language switcher
    // can point at this page in the other locale.
    effect(() => {
      this.currentPage.path.set('');
    });

    effect(() => {
      const text = this.text();

      this.title.setTitle(text.homeTitle);
      this.meta.updateTag({ name: 'description', content: text.homeTagline });
    });
  }

  protected pageLink(slug: string): string[] {
    return ['/', this.locale.code, 'guide', slug];
  }
}
