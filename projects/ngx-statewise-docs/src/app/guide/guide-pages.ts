import { DEFAULT_LOCALE, type LocaleCode } from '../i18n';
import actionsEn from './content/en/actions.md';
import apiEn from './content/en/api.md';
import effectsEn from './content/en/effects.md';
import gettingStartedEn from './content/en/getting-started.md';
import introductionEn from './content/en/introduction.md';
import managersEn from './content/en/managers.md';
import migrationEn from './content/en/migration.md';
import statesEn from './content/en/states.md';
import testingEn from './content/en/testing.md';
import updatersEn from './content/en/updaters.md';
import whyEn from './content/en/why.md';

/** A value the interface must have in every locale. */
type Translated = Record<LocaleCode, string>;

export interface GuidePage {
  /** Last segment of the route, and the name of the markdown file behind it. */
  readonly slug: string;
  readonly title: Translated;
  /** One line, used as the page description and in the sidebar tooltip. */
  readonly summary: Translated;
  /**
   * The markdown, per locale. Partial on purpose: a locale with no entry falls
   * back to the default one, and the page says so. Adding a translation is a
   * file in `content/<locale>/` and one key here.
   */
  readonly content: Partial<Translated>;
}

export interface GuideSection {
  readonly title: Translated;
  readonly pages: readonly GuidePage[];
}

/**
 * The guide, in reading order. This is the one place a page is declared: the
 * router, the sidebar, the landing page and the previous/next footer are all
 * derived from it.
 */
export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    title: { en: 'Overview', fr: 'Vue d’ensemble' },
    pages: [
      {
        slug: 'introduction',
        title: { en: 'Introduction', fr: 'Introduction' },
        summary: {
          en: 'What ngx-statewise is, and the flow it is built around.',
          fr: 'Ce qu’est ngx-statewise, et le flux qui le structure.',
        },
        content: { en: introductionEn },
      },
      {
        slug: 'why',
        title: { en: 'Why ngx-statewise', fr: 'Pourquoi ngx-statewise' },
        summary: {
          en: 'What the design buys you, and when it fits.',
          fr: 'Ce que la conception apporte, et quand elle convient.',
        },
        content: { en: whyEn },
      },
      {
        slug: 'getting-started',
        title: { en: 'Getting started', fr: 'Démarrage' },
        summary: {
          en: 'Install the package and wire provideStatewise.',
          fr: 'Installer le paquet et brancher provideStatewise.',
        },
        content: { en: gettingStartedEn },
      },
    ],
  },
  {
    title: { en: 'Key concepts', fr: 'Concepts clés' },
    pages: [
      {
        slug: 'states',
        title: { en: 'States', fr: 'States' },
        summary: {
          en: 'Where the data lives, with signals or plain properties.',
          fr: 'Où vivent les données, en signals ou en propriétés simples.',
        },
        content: { en: statesEn },
      },
      {
        slug: 'actions',
        title: { en: 'Actions', fr: 'Actions' },
        summary: {
          en: 'Action groups, single actions, and the types they generate.',
          fr: 'Groupes d’actions, actions seules, et les types générés.',
        },
        content: { en: actionsEn },
      },
      {
        slug: 'updaters',
        title: { en: 'Updaters', fr: 'Updaters' },
        summary: {
          en: 'How a state reacts to an action, and which scope owns it.',
          fr: 'Comment un état réagit à une action, et quelle portée le détient.',
        },
        content: { en: updatersEn },
      },
      {
        slug: 'effects',
        title: { en: 'Effects', fr: 'Effects' },
        summary: {
          en: 'Asynchronous work, its scope and its lifecycle.',
          fr: 'Le travail asynchrone, sa portée et son cycle de vie.',
        },
        content: { en: effectsEn },
      },
      {
        slug: 'managers',
        title: { en: 'Managers', fr: 'Managers' },
        summary: {
          en: 'The dispatch handle your components talk to.',
          fr: 'La poignée de dispatch à laquelle parlent vos composants.',
        },
        content: { en: managersEn },
      },
    ],
  },
  {
    title: { en: 'Guides', fr: 'Guides' },
    pages: [
      {
        slug: 'testing',
        title: { en: 'Testing', fr: 'Tests' },
        summary: {
          en: 'The ngx-statewise/testing entry point in a TestBed.',
          fr: 'Le point d’entrée ngx-statewise/testing dans un TestBed.',
        },
        content: { en: testingEn },
      },
      {
        slug: 'migration',
        title: {
          en: 'Migrating from 0.6.x',
          fr: 'Migrer depuis 0.6.x',
        },
        summary: {
          en: 'What the rewrite renamed, and the four behaviours it changed.',
          fr: 'Ce que la réécriture a renommé, et les quatre comportements changés.',
        },
        content: { en: migrationEn },
      },
    ],
  },
  {
    title: { en: 'Reference', fr: 'Référence' },
    pages: [
      {
        slug: 'api',
        title: { en: 'API reference', fr: 'Référence d’API' },
        summary: {
          en: 'Every export, with the signature the compiler sees.',
          fr: 'Chaque export, avec la signature que voit le compilateur.',
        },
        content: { en: apiEn },
      },
    ],
  },
];

/** Every page, flattened, still in reading order. */
export const GUIDE_PAGES: readonly GuidePage[] = GUIDE_SECTIONS.flatMap(
  (section) => section.pages,
);

export function findGuidePage(slug: string): GuidePage | undefined {
  return GUIDE_PAGES.find((page) => page.slug === slug);
}

export interface GuideContent {
  readonly markdown: string;
  /** The locale asked for has no translation, so this is the default one. */
  readonly isFallback: boolean;
  /** Which locale the markdown below is actually written in. */
  readonly locale: LocaleCode;
}

export function guideContent(page: GuidePage, code: LocaleCode): GuideContent {
  const translated = page.content[code];

  if (translated !== undefined) {
    return { markdown: translated, isFallback: false, locale: code };
  }

  const fallback = page.content[DEFAULT_LOCALE.code];

  if (fallback === undefined) {
    throw new Error(
      `the "${page.slug}" page has no content in "${code}" and none in the default locale either`,
    );
  }

  return {
    markdown: fallback,
    isFallback: true,
    locale: DEFAULT_LOCALE.code,
  };
}
