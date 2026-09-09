import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from '../i18n';
import {
  GUIDE_PAGES,
  GUIDE_SECTIONS,
  findGuidePage,
  guideContent,
  type GuidePage,
} from './guide-pages';
import { renderOptions } from '../../testing/render-options';
import { renderGuide } from './markdown';

/** Every `id="…"` the rendered page carries, heading anchors included. */
function anchorsOf(page: GuidePage, code: LocaleCode): Set<string> {
  const { html } = renderGuide(
    guideContent(page, code).markdown,
    renderOptions(),
  );

  return new Set([...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]));
}

describe('the guide registry', () => {
  it('holds fifteen pages across five sections', () => {
    expect(GUIDE_SECTIONS.length).toBe(5);
    expect(GUIDE_PAGES.length).toBe(15);
  });

  it('flattens the sections in reading order, losing none of them', () => {
    const fromSections = GUIDE_SECTIONS.flatMap((section) => section.pages);

    expect(GUIDE_PAGES).toEqual(fromSections);
  });

  it('gives every page a unique slug', () => {
    const slugs = GUIDE_PAGES.map((page) => page.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('finds a page by its slug, and nothing by an unknown one', () => {
    expect(findGuidePage('effects')?.title.en).toBe('Effects');
    expect(findGuidePage('nope')).toBeUndefined();
  });

  it('names and describes every page in every locale', () => {
    for (const page of GUIDE_PAGES) {
      for (const locale of LOCALES) {
        expect(
          page.title[locale.code]?.length,
          `${page.slug} has no ${locale.code} title`,
        ).toBeGreaterThan(0);
        expect(
          page.summary[locale.code]?.length,
          `${page.slug} has no ${locale.code} summary`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('names and describes every section in every locale', () => {
    for (const section of GUIDE_SECTIONS) {
      for (const locale of LOCALES) {
        expect(
          section.title[locale.code]?.length,
          `a section has no ${locale.code} title`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('carries content for every page in the default locale', () => {
    for (const page of GUIDE_PAGES) {
      const content = guideContent(page, DEFAULT_LOCALE.code);

      expect(content.isFallback, `${page.slug} falls back to itself`).toBe(
        false,
      );
      // The shortest page, "Why ngx-statewise", is a little over 1 kB.
      expect(content.markdown.length).toBeGreaterThan(500);
    }
  });

  it('opens every page with a level-one heading naming it', () => {
    for (const page of GUIDE_PAGES) {
      const content = guideContent(page, DEFAULT_LOCALE.code);
      const title = page.title[content.locale];

      expect(
        content.markdown.startsWith(`# ${title}\n`),
        `${page.slug} does not open with "# ${title}"`,
      ).toBe(true);
    }
  });

  it('falls back to the default locale, and says which locale it served', () => {
    const page = GUIDE_PAGES[0];
    const translated = 'fr' in page.content;
    const content = guideContent(page, 'fr');

    expect(content.isFallback).toBe(!translated);
    expect(content.locale).toBe(translated ? 'fr' : DEFAULT_LOCALE.code);
  });

  it('leaves no README-era anchor behind, pointing at a page that is gone', () => {
    const links = GUIDE_PAGES.flatMap((page) =>
      LOCALES.flatMap((locale) =>
        [
          ...guideContent(page, locale.code).markdown.matchAll(
            /]\(\/guide\/([a-z0-9-]+)(?:#([a-z0-9-]+))?\)/g,
          ),
        ].map((match) => ({
          from: page.slug,
          locale: locale.code,
          slug: match[1],
          anchor: match[2],
        })),
      ),
    );

    // Splitting one README into ten pages turned its in-page anchors into
    // cross-page ones. If this finds none, the extraction broke, not the guide.
    expect(links.length).toBeGreaterThanOrEqual(2);

    for (const link of links) {
      const target = findGuidePage(link.slug);

      expect(
        target,
        `${link.from} (${link.locale}) links to unknown page ${link.slug}`,
      ).toBeDefined();

      if (target !== undefined && link.anchor !== undefined) {
        expect(
          anchorsOf(target, link.locale).has(link.anchor),
          `${link.from} (${link.locale}) links to ${link.slug}#${link.anchor}, which has no such heading`,
        ).toBe(true);
      }
    }
  });

  it('leaves no bare in-page anchor, which would now point at the wrong page', () => {
    for (const page of GUIDE_PAGES) {
      for (const locale of LOCALES) {
        const markdown = guideContent(page, locale.code).markdown;
        const bare = [...markdown.matchAll(/]\(#([a-z0-9-]+)\)/g)];

        expect(
          bare.map((match) => match[1]),
          `${page.slug} (${locale.code}) keeps README anchors`,
        ).toEqual([]);
      }
    }
  });
});
