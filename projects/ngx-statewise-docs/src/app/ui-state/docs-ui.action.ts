import { defineActionsGroup, emptyPayload, payload } from 'ngx-statewise';
import type { Theme } from './theme';

export const themeActions = defineActionsGroup({
  source: 'THEME',
  events: {
    /** Adopts the theme found in storage at startup. */
    restore: payload<Theme>(),
    toggle: emptyPayload,
  },
});

export const navActions = defineActionsGroup({
  source: 'NAV',
  events: {
    toggle: emptyPayload,
    close: emptyPayload,
  },
});
