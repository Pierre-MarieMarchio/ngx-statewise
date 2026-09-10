import type { LocaleCode } from '../../core/i18n';

/** A value the landing page must have in every locale. */
type Translated = Record<LocaleCode, string>;

export interface ComparisonRow {
  readonly axis: Translated;
  readonly byHand: Translated;
  readonly withLibrary: Translated;
}

/**
 * What the library replaces, compared against writing the same thing with
 * plain services, not against another library. The comparison that matters to
 * someone arriving here is with what they are doing now.
 */
export const COMPARISON: readonly ComparisonRow[] = [
  {
    axis: {
      en: 'Where the state lives',
      fr: 'Où vit l’état',
    },
    byHand: {
      en: 'A service, holding whatever fields it needs.',
      fr: 'Un service, avec les champs dont il a besoin.',
    },
    withLibrary: {
      en: 'The same service, and an updater is the only thing allowed to write to it.',
      fr: 'Le même service, et un updater est seul autorisé à y écrire.',
    },
  },
  {
    axis: {
      en: 'What starts a change',
      fr: 'Ce qui déclenche un changement',
    },
    byHand: {
      en: 'A method call, from wherever happens to call it.',
      fr: 'Un appel de méthode, depuis n’importe où.',
    },
    withLibrary: {
      en: 'A dispatched action. Nothing else can start a flow.',
      fr: 'Une action dispatchée. Rien d’autre ne peut lancer un flux.',
    },
  },
  {
    axis: {
      en: 'The order things run in',
      fr: 'L’ordre d’exécution',
    },
    byHand: {
      en: 'Whatever the method body does, in the order it was typed.',
      fr: 'Ce que fait le corps de la méthode, dans l’ordre où il a été écrit.',
    },
    withLibrary: {
      en: 'Always the same: the state is written, then the side work runs.',
      fr: 'Toujours le même : l’état est écrit, puis le travail annexe part.',
    },
  },
  {
    axis: {
      en: 'Two features on one event',
      fr: 'Deux fonctionnalités sur un même événement',
    },
    byHand: {
      en: 'The caller has to know about both, and call them in the right order.',
      fr: 'L’appelant doit connaître les deux, et les appeler dans le bon ordre.',
    },
    withLibrary: {
      en: 'Each declares a handler for the same action, and neither knows the other.',
      fr: 'Chacune déclare un handler pour la même action, sans connaître l’autre.',
    },
  },
];

/**
 * The three cases the guide's "When it does not" section names, said shorter.
 * Kept on the landing page on purpose: a reader deciding is better served by
 * finding this here than four clicks in.
 */
export const NOT_FOR: readonly Translated[] = [
  {
    en: 'You need one serialisable state tree, for time-travel debugging or for replaying a session. State here is spread across injectables.',
    fr: 'Vous avez besoin d’un arbre d’état sérialisable, pour du time-travel ou pour rejouer une session. Ici l’état est réparti dans des injectables.',
  },
  {
    en: 'You compose derived state heavily. `computed` covers a lot, but there is no selector layer with memoisation and parameters.',
    fr: 'Vous composez beaucoup d’état dérivé. `computed` couvre beaucoup, mais il n’y a pas de couche de sélecteurs mémoïsés et paramétrables.',
  },
  {
    en: 'Your state is driven by streams rather than by intent. If websockets move your data more than your users do, an Observable-first library suits you better.',
    fr: 'Votre état est piloté par des flux plutôt que par l’intention. Si des websockets font bouger vos données plus que vos utilisateurs, une librairie orientée Observable vous ira mieux.',
  },
];

export interface Door {
  readonly title: Translated;
  readonly text: Translated;
  /** A guide slug, or an absolute URL when it leaves the site. */
  readonly slug?: string;
  readonly href?: string;
}

/** The three ways in, so a reader picks one instead of scrolling. */
export const DOORS: readonly Door[] = [
  {
    title: {
      en: 'Install it',
      fr: 'L’installer',
    },
    text: {
      en: 'One package, one provider, and you are dispatching.',
      fr: 'Un paquet, un provider, et vous dispatchez.',
    },
    slug: 'getting-started',
  },
  {
    title: {
      en: 'Understand the flow',
      fr: 'Comprendre le flux',
    },
    text: {
      en: 'The order every change goes through, and the two consequences.',
      fr: 'L’ordre que suit chaque changement, et les deux conséquences.',
    },
    slug: 'introduction',
  },
  {
    title: {
      en: 'Read real code',
      fr: 'Lire du vrai code',
    },
    text: {
      en: 'The showcase application, wired with the library, on GitHub.',
      fr: 'L’application de démonstration, câblée avec la librairie, sur GitHub.',
    },
    href: 'https://github.com/Pierre-MarieMarchio/ngx-statewise/tree/main/projects/ngx-statewise-showcase',
  },
];
