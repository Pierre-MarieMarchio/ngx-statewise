import { defineActionsGroup, emptyPayload, payload } from 'ngx-statewise';
import type { Theme, ThemeChoice } from '../../theme';

export const themeActions = defineActionsGroup({
  source: 'THEME',
  events: {
    /** The reader picked one, or the stored choice was restored at startup. */
    choose: payload<ThemeChoice>(),
    /** The operating system changed its mind while the page was open. */
    systemChanged: payload<Theme>(),
  },
});

export const navActions = defineActionsGroup({
  source: 'NAV',
  events: {
    toggle: emptyPayload,
    close: emptyPayload,
  },
});
