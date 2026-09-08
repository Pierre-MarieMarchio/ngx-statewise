import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GUIDE_SECTIONS } from './guide/guide-pages';
import { NPM_URL, REPOSITORY_URL } from './site';
import { DocsUiManager } from './ui-state';

@Component({
  selector: 'docs-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly sections = GUIDE_SECTIONS;
  protected readonly repositoryUrl = REPOSITORY_URL;
  protected readonly npmUrl = NPM_URL;

  private readonly ui = inject(DocsUiManager);

  protected readonly theme = this.ui.theme;
  protected readonly navOpen = this.ui.navOpen;

  protected toggleTheme(): void {
    this.ui.toggleTheme();
  }

  protected toggleNav(): void {
    this.ui.toggleNav();
  }

  protected closeNav(): void {
    this.ui.closeNav();
  }
}
