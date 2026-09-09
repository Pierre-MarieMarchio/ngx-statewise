import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from '../../core/i18n';
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
import { parsePageSource, type MetadataValue } from './front-matter';

/**
 * Everything the guide is built from has to be initialised above
 * `GUIDE_SECTIONS`.
 *
 * That list is built while this module loads, and `defineGuideSections` is
 * only reachable up there because a function declaration is hoisted. A `const`
 * is not: one of these declared below the list reads as `undefined` at the
 * moment the guide is assembled, and the failure surfaces as every spec in the
 * suite dying on a property of undefined.
 */

/** URL segments, so: lower case, digits, and single hyphens between them. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The three fields a page declares. Anything else is a typo or a hope. */
const FIELDS = ['slug', 'title', 'summary'];

/** A value the interface must have in every locale. */
export type Translated = Readonly<Record<LocaleCode, string>>;

export interface GuidePage {
  /** Last segment of the route, and the name of the markdown file behind it. */
  readonly slug: string;
  readonly title: Translated;
  /** One line, used as the page description and in the sidebar tooltip. */
  readonly summary: Translated;
  /**
   * The markdown, per locale. Partial on purpose: a locale with no entry falls
   * back to the default one, and the page says so.
   */
  readonly content: Partial<Translated>;
}

export interface GuideSection {
  readonly title: Translated;
  readonly pages: readonly GuidePage[];
}

/**
 * A page in the reading order. The imported markdown on its own is the usual
 * case; the object form is for the day a page has translations beside it,
 * which carry prose and nothing else — the metadata is declared once, in the
 * default locale's file.
 */
export type GuideSource =
  | string
  | {
      readonly source: string;
      readonly translations: Partial<Readonly<Record<LocaleCode, string>>>;
    };

interface SectionSource {
  readonly title: Translated;
  readonly pages: readonly GuideSource[];
}

/**
 * The guide, in reading order.
 *
 * This is all a new page needs here: its markdown, in the section and at the
 * position it should be read at. Its slug, title and summary are declared in
 * the file itself, beside the prose they describe — see
 * `content/en/effects.md` for the shape, and CONTRIBUTING.md for the walk
 * through. Nothing about a page is spelled out twice.
 *
 * The router, the sidebar, the landing page's contents, the previous/next
 * footer and the search index are all derived from what this returns, so this
 * stays the single place the guide is defined.
 */
export const GUIDE_SECTIONS: readonly GuideSection[] = defineGuideSections([
  {
    title: {
      en: 'Overview',
      fr: 'Vue d’ensemble',
      es: 'Visión general',
      de: 'Überblick',
      'pt-BR': 'Visão geral',
    },
    pages: [introductionEn, whyEn, gettingStartedEn],
  },
  {
    title: {
      en: 'Key concepts',
      fr: 'Concepts clés',
      es: 'Conceptos clave',
      de: 'Kernkonzepte',
      'pt-BR': 'Conceitos-chave',
    },
    pages: [statesEn, actionsEn, updatersEn, effectsEn, managersEn],
  },
  {
    title: {
      en: 'Guides',
      fr: 'Guides',
      es: 'Guías',
      de: 'Anleitungen',
      'pt-BR': 'Guias',
    },
    pages: [testingEn, migrationEn],
  },
  {
    title: {
      en: 'Reference',
      fr: 'Référence',
      es: 'Referencia',
      de: 'Referenz',
      'pt-BR': 'Referência',
    },
    pages: [apiEn],
  },
]);

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

/**
 * Reads each page's own metadata block and refuses anything half-declared.
 *
 * This runs while the module is loading, which is the point: a page missing a
 * summary in one locale, or carrying a slug that cannot be a URL, fails the
 * prerender and every spec in the suite rather than shipping a blank sidebar
 * entry. Two things it cannot see from inside the bundle — a markdown file
 * nobody imported, and a slug that disagrees with its filename — are what
 * `npm run verify:docs` checks against the filesystem instead.
 */
export function defineGuideSections(
  sections: readonly SectionSource[],
): readonly GuideSection[] {
  const claimed = new Map<string, string>();

  return sections.map((section) => ({
    title: section.title,
    pages: section.pages.map((source) => {
      const page = definePage(source);
      const owner = claimed.get(page.slug);

      if (owner !== undefined) {
        throw new Error(
          `two guide pages both call themselves "${page.slug}": ${owner} and ${describe(page)}`,
        );
      }

      claimed.set(page.slug, describe(page));

      return page;
    }),
  }));
}

function definePage(source: GuideSource): GuidePage {
  const markdown = typeof source === 'string' ? source : source.source;
  const translations = typeof source === 'string' ? {} : source.translations;
  const { metadata, body } = parsePageSource(markdown);
  const where = name(body);

  refuseUnknownFields(metadata, where);

  return {
    slug: requireSlug(metadata, where),
    title: requireTranslated(metadata, 'title', where),
    summary: requireTranslated(metadata, 'summary', where),
    content: {
      ...translated(translations),
      // Last, so a translation mistakenly filed under the default locale
      // cannot displace the file the metadata came from.
      [DEFAULT_LOCALE.code]: body,
    },
  };
}

function refuseUnknownFields(
  metadata: ReadonlyMap<string, MetadataValue>,
  where: string,
): void {
  const unknown = [...metadata.keys()].filter((key) => !FIELDS.includes(key));

  if (unknown.length > 0) {
    throw new Error(
      `${where} declares ${unknown.map((key) => `"${key}"`).join(', ')}, which nothing reads. A page declares ${FIELDS.join(', ')}, and only those.`,
    );
  }
}

function requireSlug(
  metadata: ReadonlyMap<string, MetadataValue>,
  where: string,
): string {
  const slug = metadata.get('slug');

  if (slug === undefined) {
    throw new Error(
      `${where} has no "slug". Every page declares one in its metadata block, and it has to match the name of the file.`,
    );
  }

  if (typeof slug !== 'string') {
    throw new Error(`${where} indents values under "slug", which takes one`);
  }

  if (!SLUG.test(slug)) {
    throw new Error(
      `${where} has "${slug}" as its slug, which cannot be a URL segment. Lower-case letters, digits, and single hyphens between them.`,
    );
  }

  return slug;
}

function requireTranslated(
  metadata: ReadonlyMap<string, MetadataValue>,
  field: string,
  where: string,
): Translated {
  const value = metadata.get(field);

  if (value === undefined) {
    throw new Error(
      `${where} has no "${field}". Every page declares one per locale, indented under "${field}:".`,
    );
  }

  if (typeof value === 'string') {
    throw new Error(
      `${where} gives "${field}" a single value. It needs one per locale, indented under "${field}:".`,
    );
  }

  const missing = LOCALES.filter(
    (locale) => (value.get(locale.code) ?? '').trim().length === 0,
  ).map((locale) => locale.code);

  if (missing.length > 0) {
    throw new Error(
      `${where} has no ${field} in ${missing.join(', ')}. The interface is translated into all ${String(LOCALES.length)} locales, sidebar entries included.`,
    );
  }

  // Every locale has a non-empty value: the check above is what makes reading
  // the map back as a complete record safe.
  return Object.fromEntries(
    LOCALES.map((locale) => [locale.code, value.get(locale.code)]),
  ) as Translated;
}

function translated(
  sources: Partial<Readonly<Record<LocaleCode, string>>>,
): Partial<Translated> {
  return Object.fromEntries(
    Object.entries(sources).map(([code, source]) => [
      code,
      parsePageSource(source).body,
    ]),
  );
}

/**
 * How a page is named in an error, before it is known to have a slug: its
 * first heading, which is the one thing every page has.
 */
function name(body: string): string {
  const heading = /^#\s+(.+)$/m.exec(body);

  return heading === null
    ? 'a guide page with no heading'
    : `the guide page "${heading[1].trim()}"`;
}

function describe(page: GuidePage): string {
  return `"${page.title[DEFAULT_LOCALE.code]}"`;
}
