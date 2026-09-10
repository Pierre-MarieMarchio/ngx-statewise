import { GUIDE_PAGES, findGuidePage } from './guide-pages';
import { buildSearchIndex, searchIndex } from './search-index';
import { at } from '../../../testing/at';

describe('the search index', () => {
  const index = buildSearchIndex('en');

  it('indexes every page, plus a section entry for each heading', () => {
    const pages = index.filter((entry) => entry.fragment === undefined);

    expect(pages.length).toBe(GUIDE_PAGES.length);
    // Every page has headings, so there is strictly more in the index than
    // there are pages. If this ever equals, heading extraction broke.
    expect(index.length).toBeGreaterThan(GUIDE_PAGES.length * 2);
  });

  it('does not mistake a comment inside a fenced block for a heading', () => {
    // The guide's snippets contain lines beginning with "#" and "//"; none of
    // them is a section, and one leaking in would be a dead anchor.
    const suspicious = index.filter(
      (entry) => entry.title.includes('```') || entry.title.startsWith('#'),
    );

    expect(suspicious).toEqual([]);
  });

  it('points every section entry at a heading that page really has', () => {
    for (const entry of index) {
      if (entry.fragment === undefined) {
        continue;
      }

      expect(findGuidePage(entry.slug), entry.slug).toBeDefined();
    }
  });

  it('finds a page by a prefix of its title, and ranks it first', () => {
    const results = searchIndex(index, 'effec');

    expect(results.length).toBeGreaterThan(0);
    expect(at(results, 0).slug).toBe('effects');
    expect(at(results, 0).fragment).toBeUndefined();
  });

  it('finds a section by its own words', () => {
    const results = searchIndex(index, 'lifecycle');

    expect(at(results, 0).slug).toBe('effects');
    expect(at(results, 0).fragment).toBe('lifecycle');
  });

  it('finds a page through its summary, not only its title', () => {
    const results = searchIndex(index, 'misrouted');

    expect(results.map((entry) => entry.slug)).toContain('updaters');
  });

  it('returns nothing for an empty or blank query', () => {
    expect(searchIndex(index, '')).toEqual([]);
    expect(searchIndex(index, '   ')).toEqual([]);
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(searchIndex(index, 'zzzznotathing')).toEqual([]);
  });

  it('caps how many results it hands back', () => {
    // "e" matches nearly everything; the palette must stay a shortlist.
    expect(searchIndex(index, 'e', 5).length).toBeLessThanOrEqual(5);
  });

  it('builds a French index whose page titles are the French ones', () => {
    const french = buildSearchIndex('fr');
    const results = searchIndex(french, 'démarrage');

    expect(at(results, 0)?.slug).toBe('getting-started');
  });
});
