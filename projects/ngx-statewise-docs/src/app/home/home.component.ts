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
import { REPOSITORY_URL } from '../site';

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
