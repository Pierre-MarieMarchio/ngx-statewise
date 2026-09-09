import { uiStrings, type LocaleCode, type UiStrings } from '../../core/i18n';
import { CALLOUT_KINDS, type CalloutKind, type CalloutLabels } from './callout';

/**
 * What each kind of callout is called, in one locale.
 *
 * This lives on the guide's side rather than in the interface strings: the
 * five kinds are a markdown concept, and the strings module has no business
 * knowing they exist. It reads the translations, which is the direction that
 * holds — the guide depends on the interface, never the other way round.
 */
export function calloutLabels(code: LocaleCode): CalloutLabels {
  const strings = uiStrings(code);

  // Every kind has a key, and the compiler holds this to it.
  const keys: Record<CalloutKind, keyof UiStrings> = {
    note: 'calloutNote',
    tip: 'calloutTip',
    important: 'calloutImportant',
    warning: 'calloutWarning',
    caution: 'calloutCaution',
  };

  return {
    note: strings[keys.note],
    tip: strings[keys.tip],
    important: strings[keys.important],
    warning: strings[keys.warning],
    caution: strings[keys.caution],
  } satisfies Record<(typeof CALLOUT_KINDS)[number], string>;
}
