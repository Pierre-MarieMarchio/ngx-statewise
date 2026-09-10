import {
  GUIDE_PAGES,
  GUIDE_SECTIONS,
  guideContent,
  type GuidePage,
} from './guide-pages';
import type { LocaleCode } from '../../core/i18n';
import { slugify } from './markdown';

export interface SearchEntry {
  /** The page this lands on. */
  readonly slug: string;
  /** The heading within it, when the entry is a section rather than a page. */
  readonly fragment?: string;
  readonly title: string;
  /** The page or section title above this one, for context in the results. */
  readonly context: string;
  /** Lower-cased haystack, built once so filtering stays a substring test. */
  readonly search: string;
}

const FENCE = /```[\s\S]*?```/g;
const HEADING = /^(#{2,3}) +(\S[^\n]*)$/gm;

/**
 * Everything a reader can jump to: every page, and every section of every
 * page. Built from the markdown already in the bundle, so searching costs no
 * request and no index to ship.
 */
export function buildSearchIndex(code: LocaleCode): readonly SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const section of GUIDE_SECTIONS) {
    for (const page of section.pages) {
      const title = page.title[code];

      entries.push({
        slug: page.slug,
        title,
        context: section.title[code],
        search: haystack(title, page.summary[code], section.title[code]),
      });

      for (const heading of headingsOf(page, code)) {
        entries.push({
          slug: page.slug,
          fragment: heading.id,
          title: heading.text,
          context: title,
          // The prose of the section is in the haystack but never displayed:
          // that is what makes an error message findable by pasting it in.
          search: haystack(heading.text, title, heading.body),
        });
      }
    }
  }

  return entries;
}

/**
 * Ranks a query against the index. A prefix match on the title beats a match
 * anywhere in it, which beats a match in the surrounding context — so typing
 * "eff" offers the Effects page before a section that merely mentions it.
 */
export function searchIndex(
  index: readonly SearchEntry[],
  query: string,
  limit = 12,
): readonly SearchEntry[] {
  const needle = query.trim().toLowerCase();

  if (needle.length === 0) {
    return [];
  }

  return index
    .map((entry) => ({ entry, score: score(entry, needle) }))
    .filter((scored) => scored.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.entry.title.length - b.entry.title.length,
    )
    .slice(0, limit)
    .map((scored) => scored.entry);
}

function score(entry: SearchEntry, needle: string): number {
  const title = entry.title.toLowerCase();

  if (title === needle) {
    return 100;
  }

  if (title.startsWith(needle)) {
    return 80;
  }

  if (title.includes(needle)) {
    return 60;
  }

  if (!entry.search.includes(needle)) {
    return 0;
  }

  // A page entry is a better destination than one of its sections.
  return entry.fragment === undefined ? 30 : 20;
}

interface IndexedHeading {
  readonly id: string;
  readonly text: string;
  /** The prose between this heading and the next. */
  readonly body: string;
}

/**
 * Headings of a page with the prose under each, read straight from the
 * markdown. Fenced blocks are dropped first, so a `# comment` inside a snippet
 * is never mistaken for a section.
 */
function headingsOf(page: GuidePage, code: LocaleCode): IndexedHeading[] {
  const markdown = guideContent(page, code).markdown.replace(FENCE, ' ');
  const found: IndexedHeading[] = [];
  const used = new Map<string, number>();
  const matches = [...markdown.matchAll(HEADING)];

  for (const [position, match] of matches.entries()) {
    // Strip the inline markup a heading may carry: `code`, **bold**.
    const text = (match[2] ?? '').trim().replace(/[`*_]/g, '');
    const base = slugify(text);
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);

    const from = (match.index ?? 0) + match[0].length;
    const to = matches[position + 1]?.index ?? markdown.length;

    found.push({
      id: seen === 0 ? base : `${base}-${String(seen)}`,
      text,
      body: markdown.slice(from, to),
    });
  }

  return found;
}

function haystack(...parts: string[]): string {
  return parts.join(' ').toLowerCase();
}

/** Total pages indexed, for the specs to assert against. */
export const INDEXED_PAGE_COUNT = GUIDE_PAGES.length;
