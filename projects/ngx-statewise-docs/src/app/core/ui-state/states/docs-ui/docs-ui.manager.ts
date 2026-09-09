import { DestroyRef, Injectable, computed, inject } from '@angular/core';
import { injectStatewise } from 'ngx-statewise';
import { navActions, themeActions } from './docs-ui.action';
import { docsUiUpdater } from './docs-ui.updater';
import { DocsUiState } from './docs-ui.state';
import { resolveTheme } from '../../resolve-theme';
import { ThemeEnvironment } from '../../theme-environment.service';
import type { ThemeChoice } from '../../theme';

@Injectable({ providedIn: 'root' })
export class DocsUiManager {
  private readonly state = inject(DocsUiState);
  private readonly destroyRef = inject(DestroyRef);
  private readonly environment = inject(ThemeEnvironment);
  private readonly statewise = injectStatewise(docsUiUpdater);

  /** What the reader picked, which the menu ticks. */
  public readonly themeChoice = this.state.themeChoice.asReadonly();

  /** What is painted, once `system` has been resolved. */
  public readonly theme = computed(() =>
    resolveTheme(this.state.themeChoice(), this.state.systemTheme()),
  );

  public readonly navOpen = this.state.navOpen.asReadonly();

  /**
   * Adopts the stored choice and starts following the system. Called once, at
   * startup.
   */
  public start(): void {
    this.statewise.dispatch(
      themeActions.systemChanged(this.environment.systemTheme()),
    );

    const stored = this.environment.readChoice();

    if (stored !== null) {
      this.statewise.dispatch(themeActions.choose(stored));
    }

    this.destroyRef.onDestroy(
      this.environment.watchSystem((theme) => {
        this.statewise.dispatch(themeActions.systemChanged(theme));
      }),
    );
  }

  public chooseTheme(choice: ThemeChoice): void {
    this.statewise.dispatch(themeActions.choose(choice));
  }

  public toggleNav(): void {
    this.statewise.dispatch(navActions.toggle());
  }

  public closeNav(): void {
    this.statewise.dispatch(navActions.close());
  }
}
