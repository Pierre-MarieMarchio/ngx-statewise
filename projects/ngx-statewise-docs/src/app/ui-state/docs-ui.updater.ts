import { defineUpdater } from 'ngx-statewise';
import { navActions, themeActions } from './docs-ui.action';
import { DocsUiState } from './docs-ui.state';

export const docsUiUpdater = defineUpdater(DocsUiState, (on) => {
  on(themeActions.restore, (state, theme) => {
    state.theme.set(theme);
  });

  on(themeActions.toggle, (state) => {
    state.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  });

  on(navActions.toggle, (state) => {
    state.navOpen.update((open) => !open);
  });

  on(navActions.close, (state) => {
    state.navOpen.set(false);
  });
});
