import { LOCALES } from './locale';
import { uiStrings } from './ui-strings';

describe('the interface strings', () => {
  const english = uiStrings('en');
  const keys = Object.keys(english) as (keyof typeof english)[];

  it('covers a real interface, not an empty object', () => {
    expect(keys.length).toBeGreaterThan(25);
  });

  it('translates every key in every locale', () => {
    for (const locale of LOCALES) {
      const strings = uiStrings(locale.code);
      const translated = keys.filter(
        (key) => (strings[key] ?? '').trim().length > 0,
      );

      expect(
        translated.length,
        `${locale.code} is missing ${String(keys.length - translated.length)} of ${String(keys.length)} strings`,
      ).toBe(keys.length);
    }
  });

  it('actually translates, rather than copying English across', () => {
    // Product names and a few words are legitimately identical, so this
    // asserts on the proportion rather than on each string.
    const french = uiStrings('fr');
    const identical = keys.filter((key) => french[key] === english[key]);

    expect(
      identical.length,
      `these are still English in fr: ${identical.join(', ')}`,
    ).toBeLessThan(keys.length / 4);
  });

  it('falls back to the default locale for a code it does not know', () => {
    // The route only ever provides a known locale; this guards the cast at
    // the edge, where a hand-typed URL could reach it.
    expect(uiStrings('zz' as 'en')).toEqual(english);
  });
});
