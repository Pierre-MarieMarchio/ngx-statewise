import type { CalloutKind, CalloutLabels } from '../guide/callout';
import { DEFAULT_LOCALE, type LocaleCode } from './locale';
import { DE } from './strings/de';
import { EN } from './strings/en';
import { ES } from './strings/es';
import { FR } from './strings/fr';
import { PT_BR } from './strings/pt-br';

/**
 * Every string of the interface. The guide itself is markdown, so this covers
 * the chrome around it: navigation, buttons, the landing page and the notices.
 */
export interface UiStrings {
  readonly skipToContent: string;
  readonly openNavigation: string;
  readonly closeNavigation: string;
  readonly language: string;
  readonly guideNavLabel: string;
  readonly pagerNavLabel: string;
  readonly currentLanguage: string;
  readonly onThisPage: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly copyCode: string;
  readonly codeRegion: string;
  readonly tableRegion: string;
  readonly codeCopied: string;
  readonly editThisPage: string;
  readonly breadcrumbHome: string;
  readonly theme: string;
  readonly themeLight: string;
  readonly themeDark: string;
  readonly themeSystem: string;
  readonly search: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly searchPrompt: string;
  readonly searchNoResults: string;
  readonly calloutNote: string;
  readonly calloutTip: string;
  readonly calloutImportant: string;
  readonly calloutWarning: string;
  readonly calloutCaution: string;
  readonly untranslatedTitle: string;
  readonly untranslatedBody: string;
  readonly footerLicence: string;
  readonly changelog: string;
  readonly versionLabel: string;
  /** Shown only where the interface was translated automatically. */
  readonly machineTranslated: string;
  readonly homeSubtitle: string;
  readonly homeThesis: string;
  readonly homeTagline: string;
  readonly homeGetStarted: string;
  readonly homeReadTheGuide: string;
  readonly homeFlowTitle: string;
  readonly homeFlowAction: string;
  readonly homeFlowActionText: string;
  readonly homeFlowUpdater: string;
  readonly homeFlowUpdaterText: string;
  readonly homeFlowEffect: string;
  readonly homeFlowEffectText: string;
  readonly homeFlowManager: string;
  readonly homeFlowManagerText: string;
  readonly homeFlowReturn: string;
  readonly homeFlowSynchronous: string;
  readonly homeFlowAsynchronous: string;
  readonly homeShapeTitle: string;
  readonly homeShapeNote: string;
  readonly homeSize: string;
  readonly demoRun: string;
  readonly demoReset: string;
  readonly demoStateTitle: string;
  readonly demoJournalTitle: string;
  readonly demoReturned: string;
  readonly demoEmpty: string;
  readonly demoStatusIdle: string;
  readonly demoStatusRunning: string;
  readonly demoStatusDone: string;
  readonly demoNote: string;
  readonly homeCompareTitle: string;
  readonly homeCompareByHand: string;
  readonly homeCompareWith: string;
  readonly homeNotForTitle: string;
  readonly homeNotForLead: string;
  readonly homeDoorsTitle: string;
  readonly homeContentsTitle: string;
  readonly homeTitle: string;
}

const BY_LOCALE: Record<LocaleCode, UiStrings> = {
  en: EN,
  fr: FR,
  es: ES,
  de: DE,
  'pt-BR': PT_BR,
};

export function uiStrings(code: LocaleCode): UiStrings {
  return BY_LOCALE[code] ?? BY_LOCALE[DEFAULT_LOCALE.code];
}

const CALLOUT_KEYS: Record<CalloutKind, keyof UiStrings> = {
  note: 'calloutNote',
  tip: 'calloutTip',
  important: 'calloutImportant',
  warning: 'calloutWarning',
  caution: 'calloutCaution',
};

/** The callout labels, in the shape the markdown renderer wants them. */
export function calloutLabels(code: LocaleCode): CalloutLabels {
  const strings = uiStrings(code);

  return Object.fromEntries(
    Object.entries(CALLOUT_KEYS).map(([kind, key]) => [kind, strings[key]]),
  ) as CalloutLabels;
}
