import { defineUpdater } from 'ngx-statewise';
import { navActions, themeActions } from './docs-ui.action';
import { DocsUiState } from './docs-ui.state';

export const docsUiUpdater = defineUpdater(DocsUiState, (on) => {
  on(themeActions.choose, (state, choice) => {
    state.themeChoice.set(choice);
  });

  on(themeActions.systemChanged, (state, theme) => {
    state.systemTheme.set(theme);
  });

  on(navActions.toggle, (state) => {
    state.navOpen.update((open) => !open);
  });

  on(navActions.close, (state) => {
    state.navOpen.set(false);
  });
});
