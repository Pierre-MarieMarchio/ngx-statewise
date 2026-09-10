import { Injectable, inject } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { themeActions } from './docs-ui.action';
import { DocsUiState } from './docs-ui.state';
import { resolveTheme } from '../../utils/theme.utils';
import { ThemeEnvironment } from '../../services/theme-environment.service';

/**
 * Effects run after the updater, so both of these read the choice it has just
 * written rather than deriving it from the payload.
 */
@Injectable({ providedIn: 'root' })
export class DocsUiEffect {
  private readonly state = inject(DocsUiState);
  private readonly environment = inject(ThemeEnvironment);

  public readonly persistChoiceEffect = createEffect(
    themeActions.choose,
    () => {
      this.environment.writeChoice(this.state.themeChoice());
      this.paint();
    },
  );

  /** Following the system means repainting when it changes. */
  public readonly followSystemEffect = createEffect(
    themeActions.systemChanged,
    () => {
      this.paint();
    },
  );

  private paint(): void {
    this.environment.apply(
      resolveTheme(this.state.themeChoice(), this.state.systemTheme()),
    );
  }
}
