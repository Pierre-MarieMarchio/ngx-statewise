import { Marked, type MarkedExtension, type Tokens } from 'marked';

/** A heading of a guide page, as listed by its on-page table of contents. */
export interface GuideHeading {
  readonly id: string;
  readonly text: string;
  readonly depth: number;
}

export interface RenderedGuide {
  readonly html: string;
  readonly headings: readonly GuideHeading[];
}

/**
 * Turns a router path into the URL an `href` needs. In the application this is
 * `Location.prepareExternalUrl`, which applies the deployment base href.
 */
export type ExternalUrl = (path: string) => string;

/** Depths kept in the on-page table of contents. `h1` is the page title. */
const TOC_DEPTHS = [2, 3];

/**
 * GitHub's heading-anchor algorithm, so the anchors the guide already used
 * while it was a single README keep working once it is split into pages.
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\- ]+/g, '')
    .replace(/ +/g, '-');
}

/**
 * Renders one guide page.
 *
 * Site-absolute links written in the markdown (`/guide/effects#scope`) go
 * through `toExternalUrl`: GitHub Pages serves the site from a subpath, so a
 * link left as-is would resolve against the domain root and 404.
 */
export function renderGuide(
  markdown: string,
  toExternalUrl: ExternalUrl,
): RenderedGuide {
  const headings: GuideHeading[] = [];
  const used = new Map<string, number>();

  const renderer: MarkedExtension['renderer'] = {
    heading(token: Tokens.Heading) {
      const base = slugify(token.text);
      const seen = used.get(base) ?? 0;
      used.set(base, seen + 1);
      const id = seen === 0 ? base : `${base}-${String(seen)}`;

      if (TOC_DEPTHS.includes(token.depth)) {
        headings.push({ id, text: token.text, depth: token.depth });
      }

      const inner = this.parser.parseInline(token.tokens);

      return `<h${String(token.depth)} id="${id}">${inner}</h${String(token.depth)}>`;
    },

    link(token: Tokens.Link) {
      const inner = this.parser.parseInline(token.tokens);
      const title = token.title
        ? ` title="${escapeAttribute(token.title)}"`
        : '';

      if (token.href.startsWith('/')) {
        const href = escapeAttribute(toExternalUrl(token.href));

        return `<a href="${href}"${title}>${inner}</a>`;
      }

      if (token.href.startsWith('#')) {
        return `<a href="${escapeAttribute(token.href)}"${title}>${inner}</a>`;
      }

      const href = escapeAttribute(token.href);

      return `<a href="${href}"${title} target="_blank" rel="noreferrer">${inner}</a>`;
    },
  };

  // A fresh instance: `marked.use` on the shared one would stack a renderer per
  // call, and every page would then be rendered by the previous page's closure.
  const instance = new Marked({ gfm: true }, { renderer });

  return { html: instance.parse(markdown, { async: false }), headings };
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
