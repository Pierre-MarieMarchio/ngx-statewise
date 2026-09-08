import { Injectable, inject } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { themeActions } from './docs-ui.action';
import { DocsUiState } from './docs-ui.state';
import { ThemeEnvironment } from './theme-environment.service';

/**
 * Effects run after the updater, so both of these read the theme the updater
 * has just written rather than deriving it from the payload.
 */
@Injectable({ providedIn: 'root' })
export class DocsUiEffect {
  private readonly state = inject(DocsUiState);
  private readonly environment = inject(ThemeEnvironment);

  public readonly persistThemeEffect = createEffect(themeActions.toggle, () => {
    this.commitTheme();
  });

  public readonly applyRestoredThemeEffect = createEffect(
    themeActions.restore,
    () => {
      this.commitTheme();
    },
  );

  private commitTheme(): void {
    const theme = this.state.theme();

    this.environment.apply(theme);
    this.environment.write(theme);
  }
}
