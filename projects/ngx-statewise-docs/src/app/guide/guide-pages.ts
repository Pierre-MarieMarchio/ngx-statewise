import actions from './content/actions.md';
import effects from './content/effects.md';
import gettingStarted from './content/getting-started.md';
import introduction from './content/introduction.md';
import managers from './content/managers.md';
import migration from './content/migration.md';
import states from './content/states.md';
import testing from './content/testing.md';
import updaters from './content/updaters.md';
import why from './content/why.md';

export interface GuidePage {
  /** Last segment of the route, and the name of the markdown file behind it. */
  readonly slug: string;
  readonly title: string;
  /** One line, used as the page description and in the sidebar tooltip. */
  readonly summary: string;
  readonly markdown: string;
}

export interface GuideSection {
  readonly title: string;
  readonly pages: readonly GuidePage[];
}

/**
 * The guide, in reading order. This is the one place a page is declared: the
 * router, the sidebar and the previous/next footer are all derived from it, so
 * adding a page is adding an entry here and a markdown file beside it.
 */
export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    title: 'Overview',
    pages: [
      {
        slug: 'introduction',
        title: 'Introduction',
        summary: 'What ngx-statewise is, and the flow it is built around.',
        markdown: introduction,
      },
      {
        slug: 'why',
        title: 'Why ngx-statewise',
        summary: 'What the design buys you, and when it fits.',
        markdown: why,
      },
      {
        slug: 'getting-started',
        title: 'Getting started',
        summary: 'Install the package and wire provideStatewise.',
        markdown: gettingStarted,
      },
    ],
  },
  {
    title: 'Key concepts',
    pages: [
      {
        slug: 'states',
        title: 'States',
        summary: 'Where the data lives, with signals or plain properties.',
        markdown: states,
      },
      {
        slug: 'actions',
        title: 'Actions',
        summary: 'Action groups, single actions, and the types they generate.',
        markdown: actions,
      },
      {
        slug: 'updaters',
        title: 'Updaters',
        summary: 'How a state reacts to an action, and which scope owns it.',
        markdown: updaters,
      },
      {
        slug: 'effects',
        title: 'Effects',
        summary: 'Asynchronous work, its scope and its lifecycle.',
        markdown: effects,
      },
      {
        slug: 'managers',
        title: 'Managers',
        summary: 'The dispatch handle your components talk to.',
        markdown: managers,
      },
    ],
  },
  {
    title: 'Guides',
    pages: [
      {
        slug: 'testing',
        title: 'Testing',
        summary: 'The ngx-statewise/testing entry point in a TestBed.',
        markdown: testing,
      },
      {
        slug: 'migration',
        title: 'Migrating from 0.6.x',
        summary:
          'What the rewrite renamed, and the three behaviours it changed.',
        markdown: migration,
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
