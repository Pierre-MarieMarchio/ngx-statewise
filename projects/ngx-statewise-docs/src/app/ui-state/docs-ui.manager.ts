import { Injectable, inject } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { navActions, themeActions } from './docs-ui.action';
import { docsUiUpdater } from './docs-ui.updater';
import { DocsUiState } from './docs-ui.state';
import { ThemeEnvironment } from './theme-environment.service';

@Injectable({ providedIn: 'root' })
export class DocsUiManager {
  private readonly state = inject(DocsUiState);
  private readonly environment = inject(ThemeEnvironment);
  private readonly statewise = injectStatewise(docsUiUpdater);

  public readonly theme = this.state.theme.asReadonly();
  public readonly navOpen = this.state.navOpen.asReadonly();

  /** Adopts the stored theme, if there is one. Called once, at startup. */
  public restoreTheme(): void {
    const stored = this.environment.read();

    if (stored !== null) {
      this.statewise.dispatch(themeActions.restore(stored));
    }
  }

  public toggleTheme(): void {
    this.statewise.dispatch(themeActions.toggle());
  }

  public toggleNav(): void {
    this.statewise.dispatch(navActions.toggle());
  }

  public closeNav(): void {
    this.statewise.dispatch(navActions.close());
  }
}
