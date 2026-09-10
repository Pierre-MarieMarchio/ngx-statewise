import type { MarkedExtension, Tokens } from 'marked';

/**
 * The five kinds GitHub understands, so a callout written here still renders
 * as a callout when the same markdown is read on GitHub.
 */
export const CALLOUT_KINDS = [
  'note',
  'tip',
  'important',
  'warning',
  'caution',
] as const;

export type CalloutKind = (typeof CALLOUT_KINDS)[number];

export type CalloutLabels = Record<CalloutKind, string>;

interface CalloutToken extends Tokens.Generic {
  readonly type: 'callout';
  readonly kind: CalloutKind;
}

const OPENING = /^> ?\[!(note|tip|important|warning|caution)\][^\n]*(?:\n|$)/i;
const QUOTED_LINE = /^> ?.*(?:\n|$)/;

/**
 * GitHub's alert syntax as a block extension:
 *
 * ```markdown
 * > [!NOTE]
 * > An aside that is not part of the sentence before it.
 * ```
 *
 * A docs page can say "watch out for this" in a box the eye jumps to, where a
 * README only had a paragraph beginning "Note that…".
 */
export function calloutExtension(labels: CalloutLabels): MarkedExtension {
  return {
    extensions: [
      {
        name: 'callout',
        level: 'block',

        start(source: string) {
          return /^> ?\[!/m.exec(source)?.index;
        },

        tokenizer(source: string) {
          const opening = OPENING.exec(source);

          if (opening === null) {
            return undefined;
          }

          // Everything quoted below the marker is the body.
          let raw = opening[0];
          let rest = source.slice(raw.length);

          for (;;) {
            const line = QUOTED_LINE.exec(rest);

            if (line === null) {
              break;
            }

            raw += line[0];
            rest = rest.slice(line[0].length);
          }

          const keyword = opening[1];

          if (keyword === undefined) {
            return undefined;
          }

          const body = raw
            .slice(opening[0].length)
            .replace(/^> ?/gm, '')
            .trim();

          return {
            type: 'callout',
            raw,
            kind: keyword.toLowerCase() as CalloutKind,
            tokens: this.lexer.blockTokens(body),
          };
        },

        renderer(token: Tokens.Generic) {
          const { kind, tokens } = token as CalloutToken;
          const body = this.parser.parse(tokens ?? []);

          return [
            `<aside class="callout callout--${kind}">`,
            '<p class="callout__label">',
            CALLOUT_ICONS[kind],
            `<span>${escapeText(labels[kind])}</span>`,
            '</p>',
            `<div class="callout__body">${body}</div>`,
            '</aside>',
          ].join('');
        },
      },
    ],
  };
}

function icon(...paths: string[]): string {
  return [
    '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    ...paths,
    '</svg>',
  ].join('');
}

const CALLOUT_ICONS: Record<CalloutKind, string> = {
  note: icon(
    '<circle cx="12" cy="12" r="8.6" />',
    '<path d="M12 11v5.4M12 7.9v.1" />',
  ),
  tip: icon(
    '<path d="M9 18h6M10 21h4" />',
    '<path d="M12 3a6 6 0 0 0-3.3 11 2 2 0 0 1 .8 1.6V18h5v-2.4a2 2 0 0 1 .8-1.6A6 6 0 0 0 12 3Z" />',
  ),
  important: icon(
    '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4" />',
    '<path d="M12 8v4.6M12 15.9v.1" />',
  ),
  warning: icon(
    '<path d="M12 3.5 21 19.5H3L12 3.5Z" />',
    '<path d="M12 9.5v4.2M12 16.6v.1" />',
  ),
  caution: icon(
    '<circle cx="12" cy="12" r="8.6" />',
    '<path d="M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8" />',
  ),
};

function escapeText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
