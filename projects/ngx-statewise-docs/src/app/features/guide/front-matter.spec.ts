import { parsePageSource } from './front-matter';

const PAGE = [
  '---',
  'slug: effects',
  'title:',
  '  en: Effects',
  '  fr: Effects',
  'summary:',
  '  en: Asynchronous work: its scope, and its lifecycle.',
  '---',
  '',
  '# Effects',
  '',
  'Prose.',
].join('\n');

describe('a guide page metadata block', () => {
  it('reads scalars and the locale maps indented under a name', () => {
    const { metadata } = parsePageSource(PAGE);

    expect(metadata.get('slug')).toBe('effects');
    expect(metadata.get('title')).toEqual(
      new Map([
        ['en', 'Effects'],
        ['fr', 'Effects'],
      ]),
    );
  });

  it('lets a value keep its colons, so nothing has to be quoted', () => {
    const summary = parsePageSource(PAGE).metadata.get('summary');

    expect(summary).toEqual(
      new Map([['en', 'Asynchronous work: its scope, and its lifecycle.']]),
    );
  });

  it('strips the quotes a YAML habit puts around a value', () => {
    const source = ['---', 'slug: "effects"', "title: 'Effects'", '---'].join(
      '\n',
    );
    const { metadata } = parsePageSource(source);

    expect(metadata.get('slug')).toBe('effects');
    expect(metadata.get('title')).toBe('Effects');
  });

  it('hands back the markdown below it, without the blank lines between', () => {
    expect(parsePageSource(PAGE).body).toBe('# Effects\n\nProse.');
  });

  it('reports no metadata at all rather than inventing any', () => {
    const { metadata, body } = parsePageSource('# Effects\n');

    expect(metadata.size).toBe(0);
    expect(body).toBe('# Effects\n');
  });

  it('refuses a block that is opened and never closed', () => {
    expect(() => parsePageSource('---\nslug: effects\n\n# Effects\n')).toThrow(
      /never closes it/,
    );
  });

  it('refuses a line that is not a pair, instead of skipping it', () => {
    expect(() => parsePageSource('---\nslug effects\n---\n')).toThrow(
      /not a "key: value" pair/,
    );
  });

  it('refuses a value indented under nothing', () => {
    expect(() => parsePageSource('---\n  en: Effects\n---\n')).toThrow(
      /indented under nothing/,
    );
  });

  it('refuses a name given two values', () => {
    expect(() =>
      parsePageSource('---\nslug: effects\nslug: managers\n---\n'),
    ).toThrow(/a second value/);

    expect(() =>
      parsePageSource('---\ntitle:\n  en: One\n  en: Two\n---\n'),
    ).toThrow(/a second value/);
  });
});
