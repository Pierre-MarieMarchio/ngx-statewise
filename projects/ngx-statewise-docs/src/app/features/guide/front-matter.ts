/**
 * The metadata block a guide page opens with.
 *
 * This is deliberately not a YAML parser. A page needs scalars and one level
 * of nesting, a name and one line per locale, and a dependency that reads
 * the whole language would be a large answer to a small question. What it
 * accepts is exactly this, and nothing else:
 *
 * ```
 * ---
 * slug: effects
 * title:
 *   en: Effects
 *   fr: Effects
 * ---
 *
 * # Effects
 * ```
 *
 * A value runs to the end of its line, so a colon inside one needs no
 * quoting: `summary: A worked suite: what it returns` is read whole. Matching
 * single or double quotes around a value are stripped, because that is what a
 * YAML habit puts there, and nothing inside them is unescaped, so quoting is
 * never necessary here, so it never has to be clever.
 *
 * Every other shape throws. A line this cannot read is a page that would
 * otherwise ship half-declared, and the guide's whole point is that a page
 * cannot.
 */

/** A scalar, or the locale map an indented block builds. */
export type MetadataValue = string | ReadonlyMap<string, string>;

export interface ParsedPage {
  /** Empty when the source opens with no metadata block at all. */
  readonly metadata: ReadonlyMap<string, MetadataValue>;
  /** The markdown below the block, with the blank lines after it removed. */
  readonly body: string;
}

const FENCE = '---';

export function parsePageSource(source: string): ParsedPage {
  const lines = source.split('\n');

  if (lines[0]?.trim() !== FENCE) {
    return { metadata: new Map(), body: source };
  }

  const closing = lines.findIndex(
    (line, index) => index > 0 && line.trim() === FENCE,
  );

  if (closing === -1) {
    throw new Error(
      `a guide page opens a "${FENCE}" metadata block and never closes it`,
    );
  }

  return {
    metadata: parseFields(lines.slice(1, closing)),
    body: lines
      .slice(closing + 1)
      .join('\n')
      .replace(/^\n+/, ''),
  };
}

function parseFields(
  lines: readonly string[],
): ReadonlyMap<string, MetadataValue> {
  const fields = new Map<string, MetadataValue>();
  let nested: Map<string, string> | undefined;

  for (const [offset, raw] of lines.entries()) {
    const line = raw.replace(/\r$/, '');

    if (line.trim().length === 0) {
      continue;
    }

    // Line 1 is the opening fence, so the first field is on line 2.
    const where = `line ${String(offset + 2)} of a guide page's metadata`;
    const { key, value } = splitField(line, where);

    if (/^\s/.test(line)) {
      addNested(nested, key, value, where);
      continue;
    }

    if (fields.has(key)) {
      throw new Error(`${where} gives "${key}" a second value`);
    }

    // A name with nothing after its colon opens an indented block.
    if (value.length === 0) {
      nested = new Map();
      fields.set(key, nested);
      continue;
    }

    nested = undefined;
    fields.set(key, value);
  }

  return fields;
}

/** One `key: value` line, with the quotes a YAML habit adds taken back off. */
function splitField(
  line: string,
  where: string,
): { readonly key: string; readonly value: string } {
  const colon = line.indexOf(':');

  if (colon === -1) {
    throw new Error(`${where} is not a "key: value" pair: "${line.trim()}"`);
  }

  const key = line.slice(0, colon).trim();

  if (key.length === 0) {
    throw new Error(`${where} has no name before its colon`);
  }

  return { key, value: unquote(line.slice(colon + 1).trim()) };
}

/** An indented line belongs to the block the last unindented name opened. */
function addNested(
  block: Map<string, string> | undefined,
  key: string,
  value: string,
  where: string,
): void {
  if (block === undefined) {
    throw new Error(`${where} is indented under nothing: "${key}"`);
  }

  if (block.has(key)) {
    throw new Error(`${where} gives "${key}" a second value`);
  }

  block.set(key, value);
}

function unquote(value: string): string {
  const quote = value.slice(0, 1);

  return (quote === '"' || quote === "'") &&
    value.length >= 2 &&
    value.endsWith(quote)
    ? value.slice(1, -1)
    : value;
}
