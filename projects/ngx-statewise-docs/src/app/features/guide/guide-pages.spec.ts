import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from '../../core/i18n';
import {
  GUIDE_PAGES,
  GUIDE_SECTIONS,
  defineGuideSections,
  findGuidePage,
  guideContent,
  type GuidePage,
  type Translated,
} from './guide-pages';
import { renderOptions } from '../../../testing/render-options';
import { renderGuide } from './markdown';
import { at } from '../../../testing/at';

/** Every `id="…"` the rendered page carries, heading anchors included. */
function anchorsOf(page: GuidePage, code: LocaleCode): Set<string> {
  const { html } = renderGuide(
    guideContent(page, code).markdown,
    renderOptions(),
  );

  return new Set(
    [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1] ?? ''),
  );
}

describe('the guide registry', () => {
  it('is made of sections that each hold at least one page', () => {
    expect(GUIDE_SECTIONS.length).toBeGreaterThan(0);

    for (const section of GUIDE_SECTIONS) {
      expect(
        section.pages.length,
        `the "${section.title.en}" section has no pages`,
      ).toBeGreaterThan(0);
    }
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
    const page = at(GUIDE_PAGES, 0);
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
          slug: match[1] ?? '',
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
          bare.map((match) => match[1] ?? ''),
          `${page.slug} (${locale.code}) keeps README anchors`,
        ).toEqual([]);
      }
    }
  });
});

/** A section title, which the compiler already requires in every locale. */
const SECTION: Translated = {
  en: 'Section',
  fr: 'Section',
};

/** A page whose metadata block is complete, for a spec to spoil one line of. */
const COMPLETE = [
  '---',
  'slug: effects',
  'title:',
  '  en: Effects',
  '  fr: Effects',
  'summary:',
  '  en: One line.',
  '  fr: Une ligne.',
  '---',
  '',
  '# Effects',
].join('\n');

function declaring(page: string): () => unknown {
  return () => defineGuideSections([{ title: SECTION, pages: [page] }]);
}

describe('declaring a guide page', () => {
  it('accepts one whose metadata block is complete', () => {
    const section = at(
      defineGuideSections([{ title: SECTION, pages: [COMPLETE] }]),
    );

    expect(at(section.pages, 0).slug).toBe('effects');
    expect(at(section.pages, 0).title.fr).toBe('Effects');
    expect(at(section.pages, 0).content.en).toBe('# Effects');
  });

  it('refuses one with no metadata block, naming it by its heading', () => {
    expect(declaring('# Effects\n')).toThrow(
      /the guide page "Effects" has no "slug"/,
    );
  });

  it('refuses a slug that could not be a URL segment', () => {
    expect(
      declaring(COMPLETE.replace('slug: effects', 'slug: Effects!')),
    ).toThrow(/cannot be a URL segment/);
  });

  it('refuses a summary missing in one locale, and says which', () => {
    expect(declaring(COMPLETE.replace('  fr: Une ligne.\n', ''))).toThrow(
      /has no summary in fr/,
    );
  });

  it('refuses a title given a single value instead of one per locale', () => {
    const flattened = COMPLETE.split('\n')
      .filter((line) => !/^ {2}\w+(-BR)?: Effects$/.test(line))
      .join('\n')
      .replace('title:', 'title: Effects');

    expect(declaring(flattened)).toThrow(/needs one per locale/);
  });

  it('refuses a field nothing reads, rather than ignoring it', () => {
    expect(
      declaring(
        COMPLETE.replace('slug: effects', 'slug: effects\nauthor: someone'),
      ),
    ).toThrow(/declares "author", which nothing reads/);
  });

  it('refuses two pages claiming the same slug', () => {
    expect(() =>
      defineGuideSections([{ title: SECTION, pages: [COMPLETE, COMPLETE] }]),
    ).toThrow(/both call themselves "effects"/);
  });

  it('takes a translation as prose, the metadata staying in the default file', () => {
    const section = at(
      defineGuideSections([
        {
          title: SECTION,
          pages: [
            {
              source: COMPLETE,
              translations: {
                fr: '---\nslug: effects\n---\n\n# Effects, en français',
              },
            },
          ],
        },
      ]),
    );

    expect(at(section.pages, 0).content.fr).toBe('# Effects, en français');
    expect(guideContent(at(section.pages, 0), 'fr').isFallback).toBe(false);
  });

  it('falls back to the default locale for a page carrying no translation', () => {
    const section = at(
      defineGuideSections([{ title: SECTION, pages: [COMPLETE] }]),
    );
    const content = guideContent(at(section.pages, 0), 'fr');

    expect(content.isFallback).toBe(true);
    expect(content.locale).toBe('en');
    expect(content.markdown).toBe('# Effects');
  });
});
