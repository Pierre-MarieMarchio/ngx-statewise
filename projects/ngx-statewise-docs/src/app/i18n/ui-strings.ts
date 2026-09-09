import type { CalloutKind, CalloutLabels } from '../guide/callout';
import { DEFAULT_LOCALE, type LocaleCode } from './locale';

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
  readonly homeContentsTitle: string;
  readonly homeTitle: string;
}

const EN: UiStrings = {
  skipToContent: 'Skip to content',
  openNavigation: 'Open navigation',
  closeNavigation: 'Close navigation',
  language: 'Language',
  guideNavLabel: 'Guide',
  pagerNavLabel: 'Guide pages',
  currentLanguage: 'Current language',
  onThisPage: 'On this page',
  previousPage: 'Previous',
  nextPage: 'Next',
  copyCode: 'Copy code',
  codeRegion: 'Code sample',
  tableRegion: 'Table',
  codeCopied: 'Copied',
  editThisPage: 'Edit this page on GitHub',
  breadcrumbHome: 'Home',
  theme: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',
  search: 'Search',
  searchLabel: 'Search the guide',
  searchPlaceholder: 'Search the guide…',
  searchPrompt: 'Type to search pages and sections.',
  searchNoResults: 'Nothing matches that.',
  calloutNote: 'Note',
  calloutTip: 'Tip',
  calloutImportant: 'Important',
  calloutWarning: 'Warning',
  calloutCaution: 'Careful',
  untranslatedTitle: 'This page is not translated yet',
  untranslatedBody: 'It is shown in English.',
  footerLicence: 'ngx-statewise is released under the GPL-3.0 licence.',
  changelog: 'Changelog',
  homeSubtitle: 'Angular state management',
  homeThesis: 'The state is already written when your effects run.',
  homeTagline:
    'Signals for state, actions for intent, effects for everything else. Simpler than NgRx, more structured than doing it by hand.',
  homeGetStarted: 'Get started',
  homeReadTheGuide: 'Read the guide',
  homeFlowTitle: 'The whole flow',
  homeFlowAction: 'Action',
  homeFlowActionText: 'carries the intent and its payload.',
  homeFlowUpdater: 'Updater',
  homeFlowUpdaterText: 'writes the state, synchronously.',
  homeFlowEffect: 'Effect',
  homeFlowEffectText: 'runs the side work, on state already up to date.',
  homeFlowManager: 'Manager',
  homeFlowManagerText: 'exposes the signals and dispatches, in its own scope.',
  homeFlowReturn: 'may return an action',
  homeFlowSynchronous: 'synchronous',
  homeFlowAsynchronous: 'asynchronous',
  homeShapeTitle: 'What you write',
  homeShapeNote:
    'That is the whole surface for one feature. The rest of the guide is what happens when a flow gets harder than a login.',
  homeSize: 'The whole library is {size} kB minified and gzipped.',
  homeContentsTitle: 'Contents',
  homeTitle: 'ngx-statewise — state management for Angular',
};

const FR: UiStrings = {
  skipToContent: 'Aller au contenu',
  openNavigation: 'Ouvrir la navigation',
  closeNavigation: 'Fermer la navigation',
  language: 'Langue',
  guideNavLabel: 'Guide',
  pagerNavLabel: 'Pages du guide',
  currentLanguage: 'Langue actuelle',
  onThisPage: 'Sur cette page',
  previousPage: 'Précédent',
  nextPage: 'Suivant',
  copyCode: 'Copier le code',
  codeRegion: 'Extrait de code',
  tableRegion: 'Tableau',
  codeCopied: 'Copié',
  editThisPage: 'Modifier cette page sur GitHub',
  breadcrumbHome: 'Accueil',
  theme: 'Thème',
  themeLight: 'Clair',
  themeDark: 'Sombre',
  themeSystem: 'Système',
  search: 'Rechercher',
  searchLabel: 'Rechercher dans le guide',
  searchPlaceholder: 'Rechercher dans le guide…',
  searchPrompt: 'Tapez pour chercher une page ou une section.',
  searchNoResults: 'Aucun résultat.',
  calloutNote: 'Remarque',
  calloutTip: 'Astuce',
  calloutImportant: 'Important',
  calloutWarning: 'Attention',
  calloutCaution: 'Prudence',
  untranslatedTitle: "Cette page n'est pas encore traduite",
  untranslatedBody: 'Elle est affichée en anglais.',
  footerLicence: 'ngx-statewise est publié sous licence GPL-3.0.',
  changelog: 'Journal des versions',
  homeSubtitle: 'Gestion d’état pour Angular',
  homeThesis: 'L’état est déjà écrit quand vos effects démarrent.',
  homeTagline:
    'Des signals pour l’état, des actions pour l’intention, des effects pour tout le reste. Plus simple que NgRx, plus structuré qu’à la main.',
  homeGetStarted: 'Commencer',
  homeReadTheGuide: 'Lire le guide',
  homeFlowTitle: 'Tout le flux',
  homeFlowAction: 'Action',
  homeFlowActionText: 'porte l’intention et sa charge utile.',
  homeFlowUpdater: 'Updater',
  homeFlowUpdaterText: 'écrit l’état, de façon synchrone.',
  homeFlowEffect: 'Effect',
  homeFlowEffectText: 'exécute le travail annexe, sur un état déjà à jour.',
  homeFlowManager: 'Manager',
  homeFlowManagerText:
    'expose les signals et dispatche, dans sa propre portée.',
  homeFlowReturn: 'peut renvoyer une action',
  homeFlowSynchronous: 'synchrone',
  homeFlowAsynchronous: 'asynchrone',
  homeShapeTitle: 'Ce que vous écrivez',
  homeShapeNote:
    'C’est toute la surface pour une fonctionnalité. Le reste du guide traite des flux plus retors qu’un login.',
  homeSize: 'Toute la librairie pèse {size} ko, minifiée et gzippée.',
  homeContentsTitle: 'Sommaire',
  homeTitle: 'ngx-statewise — gestion d’état pour Angular',
};

const BY_LOCALE: Record<LocaleCode, UiStrings> = { en: EN, fr: FR };

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
