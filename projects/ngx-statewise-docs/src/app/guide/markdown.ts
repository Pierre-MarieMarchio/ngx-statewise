import { Marked, type MarkedExtension, type Tokens } from 'marked';
import { calloutExtension, type CalloutLabels } from './callout';

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

export interface RenderGuideOptions {
  /**
   * Turns a site path into the URL an `href` needs. In the application this is
   * `Location.prepareExternalUrl` with the locale segment already on it.
   */
  readonly toExternalUrl: (path: string) => string;
  /** Localised, because they end up in the markup as accessible labels. */
  readonly copyCodeLabel: string;
  readonly headingLinkLabel: string;
  readonly calloutLabels: CalloutLabels;
  /** Names the scrollable regions a keyboard user has to be able to reach. */
  readonly codeRegionLabel: string;
  readonly tableRegionLabel: string;
}

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

/** Renders one guide page. */
export function renderGuide(
  markdown: string,
  options: RenderGuideOptions,
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

      const level = String(token.depth);
      const inner = this.parser.parseInline(token.tokens);
      // A permalink for the section, revealed on hover. Hidden from assistive
      // technology, which already reads the heading itself.
      const permalink =
        token.depth > 1
          ? `<a class="heading-anchor" href="#${id}" title="${escapeAttribute(options.headingLinkLabel)}" aria-hidden="true" tabindex="-1">#</a>`
          : '';

      return `<h${level} id="${id}">${inner}${permalink}</h${level}>`;
    },

    code(token: Tokens.Code) {
      const { language, title } = parseFenceInfo(token.lang ?? '');
      const body = token.escaped ? token.text : escapeHtml(token.text);
      const languageClass = language
        ? ` class="language-${escapeAttribute(language)}"`
        : '';
      const label = escapeAttribute(options.copyCodeLabel);

      // A title beats a bare language: on a docs site, knowing which file a
      // snippet belongs in is most of the answer.
      const caption =
        title !== undefined
          ? `<span class="code-block__title">${escapeHtml(title)}</span>`
          : `<span class="code-block__language">${escapeHtml(language)}</span>`;

      // The copy button is plain markup: this HTML is injected with innerHTML,
      // so an Angular component could not live inside it. The page listens for
      // the click instead.
      return [
        `<div class="code-block"${title !== undefined ? ' data-titled' : ''}>`,
        '<div class="code-block__bar">',
        caption,
        `<button class="code-block__copy" type="button" data-copy-code title="${label}" aria-label="${label}">`,
        COPY_ICON,
        '</button>',
        '</div>',
        // tabindex and a role: the block scrolls sideways, and a scroll
        // container no keyboard can reach fails WCAG 2.1.1.
        `<pre class="code-block__pre" tabindex="0" role="region" aria-label="${escapeAttribute(title ?? options.codeRegionLabel)}"><code${languageClass}>${body}</code></pre>`,
        '</div>',
      ].join('');
    },

    table(token: Tokens.Table) {
      // `display: block` on a <table> is what used to give it a scrollbar, and
      // it costs the table its semantics in the accessibility tree. A wrapper
      // scrolls instead, and it is focusable so a keyboard can drive it.
      const cell = (item: Tokens.TableCell, tag: 'th' | 'td'): string => {
        const align = item.align ? ` align="${item.align}"` : '';

        return `<${tag}${align}>${this.parser.parseInline(item.tokens)}</${tag}>`;
      };

      const head = token.header.map((item) => cell(item, 'th')).join('');
      const body = token.rows
        .map(
          (row) => `<tr>${row.map((item) => cell(item, 'td')).join('')}</tr>`,
        )
        .join('');

      return [
        `<div class="table-scroll" tabindex="0" role="region" aria-label="${escapeAttribute(options.tableRegionLabel)}">`,
        `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`,
        '</div>',
      ].join('');
    },

    link(token: Tokens.Link) {
      const inner = this.parser.parseInline(token.tokens);
      const title = token.title
        ? ` title="${escapeAttribute(token.title)}"`
        : '';

      if (token.href.startsWith('/')) {
        const href = escapeAttribute(options.toExternalUrl(token.href));

        return `<a href="${href}"${title}>${inner}</a>`;
      }

      if (token.href.startsWith('#')) {
        return `<a href="${escapeAttribute(token.href)}"${title}>${inner}</a>`;
      }

      return `<a href="${escapeAttribute(token.href)}"${title} target="_blank" rel="noreferrer">${inner}</a>`;
    },
  };

  // A fresh instance: `marked.use` on the shared one would stack a renderer per
  // call, and every page would then be rendered by the previous page's closure.
  const instance = new Marked(
    { gfm: true },
    calloutExtension(options.calloutLabels),
    { renderer },
  );

  return { html: instance.parse(markdown, { async: false }), headings };
}

/** Material Symbols "content_copy", traced so the site ships no icon font. */
const COPY_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="9" y="9" width="11" height="11" rx="2" />' +
  '<path d="M15 6.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h1.5" />' +
  '</svg>';

/**
 * The info string of a fence: a language, then optionally `title="…"` naming
 * the file the snippet belongs in.
 */
export function parseFenceInfo(info: string): {
  language: string;
  title?: string;
} {
  const title = /title="([^"]*)"/.exec(info);
  const language = info
    .replace(/title="[^"]*"/, '')
    .trim()
    .split(/\s+/)[0];

  return title === null ? { language } : { language, title: title[1] };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
