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
    title: {
      en: 'Overview',
      fr: 'Vue d’ensemble',
      es: 'Visión general',
      de: 'Überblick',
      'pt-BR': 'Visão geral',
    },
    pages: [
      {
        slug: 'introduction',
        title: {
          en: 'Introduction',
          fr: 'Introduction',
          es: 'Introducción',
          de: 'Einführung',
          'pt-BR': 'Introdução',
        },
        summary: {
          en: 'What ngx-statewise is, and the flow it is built around.',
          fr: 'Ce qu’est ngx-statewise, et le flux qui le structure.',
          es: 'Qué es ngx-statewise y el flujo sobre el que está construido.',
          de: 'Was ngx-statewise ist und der Ablauf, um den herum es gebaut ist.',
          'pt-BR':
            'O que é ngx-statewise e o fluxo em torno do qual foi construído.',
        },
        content: { en: introductionEn },
      },
      {
        slug: 'why',
        title: {
          en: 'Why ngx-statewise',
          fr: 'Pourquoi ngx-statewise',
          es: 'Por qué ngx-statewise',
          de: 'Warum ngx-statewise',
          'pt-BR': 'Por que ngx-statewise',
        },
        summary: {
          en: 'What the design buys you, and when it fits.',
          fr: 'Ce que la conception apporte, et quand elle convient.',
          es: 'Qué te aporta el diseño y cuándo encaja.',
          de: 'Was der Entwurf dir bringt und wann er passt.',
          'pt-BR': 'O que o desenho te dá, e quando ele serve.',
        },
        content: { en: whyEn },
      },
      {
        slug: 'getting-started',
        title: {
          en: 'Getting started',
          fr: 'Démarrage',
          es: 'Empezar',
          de: 'Loslegen',
          'pt-BR': 'Começar',
        },
        summary: {
          en: 'Install the package and wire provideStatewise.',
          fr: 'Installer le paquet et brancher provideStatewise.',
          es: 'Instalar el paquete y conectar provideStatewise.',
          de: 'Das Paket installieren und provideStatewise verdrahten.',
          'pt-BR': 'Instalar o pacote e ligar provideStatewise.',
        },
        content: { en: gettingStartedEn },
      },
    ],
  },
  {
    title: {
      en: 'Key concepts',
      fr: 'Concepts clés',
      es: 'Conceptos clave',
      de: 'Kernkonzepte',
      'pt-BR': 'Conceitos-chave',
    },
    pages: [
      {
        slug: 'states',
        title: {
          en: 'States',
          fr: 'States',
          es: 'States',
          de: 'States',
          'pt-BR': 'States',
        },
        summary: {
          en: 'Where the data lives, with signals or plain properties.',
          fr: 'Où vivent les données, en signals ou en propriétés simples.',
          es: 'Dónde viven los datos, con signals o propiedades simples.',
          de: 'Wo die Daten liegen, mit Signals oder einfachen Feldern.',
          'pt-BR': 'Onde os dados moram, com signals ou propriedades simples.',
        },
        content: { en: statesEn },
      },
      {
        slug: 'actions',
        title: {
          en: 'Actions',
          fr: 'Actions',
          es: 'Actions',
          de: 'Actions',
          'pt-BR': 'Actions',
        },
        summary: {
          en: 'Action groups, single actions, and the types they generate.',
          fr: 'Groupes d’actions, actions seules, et les types générés.',
          es: 'Grupos de actions, actions sueltas y los tipos que generan.',
          de: 'Action-Gruppen, einzelne Actions und die Typen, die sie erzeugen.',
          'pt-BR': 'Grupos de actions, actions avulsas e os tipos que geram.',
        },
        content: { en: actionsEn },
      },
      {
        slug: 'updaters',
        title: {
          en: 'Updaters',
          fr: 'Updaters',
          es: 'Updaters',
          de: 'Updaters',
          'pt-BR': 'Updaters',
        },
        summary: {
          en: 'How a state reacts to an action, and which scope owns it.',
          fr: 'Comment un état réagit à une action, et quelle portée le détient.',
          es: 'Cómo reacciona un state a una action, y qué ámbito lo posee.',
          de: 'Wie ein State auf eine Action reagiert und welcher Bereich ihn besitzt.',
          'pt-BR': 'Como um state reage a uma action, e qual escopo o detém.',
        },
        content: { en: updatersEn },
      },
      {
        slug: 'effects',
        title: {
          en: 'Effects',
          fr: 'Effects',
          es: 'Effects',
          de: 'Effects',
          'pt-BR': 'Effects',
        },
        summary: {
          en: 'Asynchronous work, its scope and its lifecycle.',
          fr: 'Le travail asynchrone, sa portée et son cycle de vie.',
          es: 'El trabajo asíncrono, su ámbito y su ciclo de vida.',
          de: 'Asynchrone Arbeit, ihr Geltungsbereich und ihr Lebenszyklus.',
          'pt-BR': 'O trabalho assíncrono, seu escopo e seu ciclo de vida.',
        },
        content: { en: effectsEn },
      },
      {
        slug: 'managers',
        title: {
          en: 'Managers',
          fr: 'Managers',
          es: 'Managers',
          de: 'Managers',
          'pt-BR': 'Managers',
        },
        summary: {
          en: 'The dispatch handle your components talk to.',
          fr: 'La poignée de dispatch à laquelle parlent vos composants.',
          es: 'El manejador de dispatch con el que hablan tus componentes.',
          de: 'Der Dispatch-Griff, mit dem deine Komponenten sprechen.',
          'pt-BR': 'A alça de dispatch com que seus componentes falam.',
        },
        content: { en: managersEn },
      },
    ],
  },
  {
    title: {
      en: 'Guides',
      fr: 'Guides',
      es: 'Guías',
      de: 'Anleitungen',
      'pt-BR': 'Guias',
    },
    pages: [
      {
        slug: 'testing',
        title: {
          en: 'Testing',
          fr: 'Tests',
          es: 'Pruebas',
          de: 'Tests',
          'pt-BR': 'Testes',
        },
        summary: {
          en: 'The ngx-statewise/testing entry point in a TestBed.',
          fr: 'Le point d’entrée ngx-statewise/testing dans un TestBed.',
          es: 'El punto de entrada ngx-statewise/testing en un TestBed.',
          de: 'Der Einstiegspunkt ngx-statewise/testing in einem TestBed.',
          'pt-BR': 'O ponto de entrada ngx-statewise/testing em um TestBed.',
        },
        content: { en: testingEn },
      },
      {
        slug: 'migration',
        title: {
          en: 'Migrating from 0.6.x',
          fr: 'Migrer depuis 0.6.x',
          es: 'Migrar desde 0.6.x',
          de: 'Migration von 0.6.x',
          'pt-BR': 'Migrar do 0.6.x',
        },
        summary: {
          en: 'What the rewrite renamed, and the four behaviours it changed.',
          fr: 'Ce que la réécriture a renommé, et les quatre comportements changés.',
          es: 'Qué renombró la reescritura y los cuatro comportamientos que cambió.',
          de: 'Was die Neufassung umbenannt hat, und die vier geänderten Verhalten.',
          'pt-BR':
            'O que a reescrita renomeou, e os quatro comportamentos que mudou.',
        },
        content: { en: migrationEn },
      },
    ],
  },
  {
    title: {
      en: 'Reference',
      fr: 'Référence',
      es: 'Referencia',
      de: 'Referenz',
      'pt-BR': 'Referência',
    },
    pages: [
      {
        slug: 'api',
        title: {
          en: 'API reference',
          fr: 'Référence d’API',
          es: 'Referencia de API',
          de: 'API-Referenz',
          'pt-BR': 'Referência da API',
        },
        summary: {
          en: 'Every export, with the signature the compiler sees.',
          fr: 'Chaque export, avec la signature que voit le compilateur.',
          es: 'Cada export, con la firma que ve el compilador.',
          de: 'Jeder Export, mit der Signatur, die der Compiler sieht.',
          'pt-BR': 'Cada export, com a assinatura que o compilador vê.',
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
