import {
  GUIDE_PAGES,
  GUIDE_SECTIONS,
  findGuidePage,
  type GuidePage,
} from './guide-pages';
import { renderGuide } from './markdown';

/** Every `id="…"` the rendered page carries, heading anchors included. */
function anchorsOf(page: GuidePage): Set<string> {
  const { html } = renderGuide(page.markdown, (path) => path);

  return new Set([...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]));
}

describe('the guide registry', () => {
  it('holds the eleven-section guide split into ten pages', () => {
    expect(GUIDE_SECTIONS.length).toBe(3);
    expect(GUIDE_PAGES.length).toBe(10);
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
    expect(findGuidePage('effects')?.title).toBe('Effects');
    expect(findGuidePage('nope')).toBeUndefined();
  });

  it('opens every page with a level-one heading naming it', () => {
    for (const page of GUIDE_PAGES) {
      expect(page.markdown.startsWith(`# ${page.title}\n`)).toBe(true);
    }
  });

  it('carries real content on every page', () => {
    for (const page of GUIDE_PAGES) {
      // The shortest page, "Why ngx-statewise", is a little over 1 kB.
      expect(page.markdown.length).toBeGreaterThan(500);
      expect(page.summary.length).toBeGreaterThan(0);
    }
  });

  it('leaves no README-era anchor behind, pointing at a page that is gone', () => {
    const crossPageLinks = GUIDE_PAGES.flatMap((page) =>
      [
        ...page.markdown.matchAll(
          /]\(\/guide\/([a-z0-9-]+)(?:#([a-z0-9-]+))?\)/g,
        ),
      ].map((match) => ({ from: page.slug, slug: match[1], anchor: match[2] })),
    );

    // Splitting one README into ten pages turned its in-page anchors into
    // cross-page ones. If this finds none, the extraction broke, not the guide.
    expect(crossPageLinks.length).toBeGreaterThanOrEqual(2);

    for (const link of crossPageLinks) {
      const target = findGuidePage(link.slug);

      expect(
        target,
        `${link.from} links to unknown page ${link.slug}`,
      ).toBeDefined();

      if (target !== undefined && link.anchor !== undefined) {
        expect(
          anchorsOf(target).has(link.anchor),
          `${link.from} links to ${link.slug}#${link.anchor}, which has no such heading`,
        ).toBe(true);
      }
    }
  });

  it('leaves no bare in-page anchor, which would now point at the wrong page', () => {
    for (const page of GUIDE_PAGES) {
      const bare = [...page.markdown.matchAll(/]\(#([a-z0-9-]+)\)/g)];

      expect(
        bare.map((match) => match[1]),
        `${page.slug} keeps README anchors`,
      ).toEqual([]);
    }
  });
});
