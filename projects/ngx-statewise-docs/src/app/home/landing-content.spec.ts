import { findGuidePage } from '../guide/guide-pages';
import { LOCALES, type LocaleCode } from '../i18n';
import { COMPARISON, DOORS, NOT_FOR } from './landing-content';

/** Every string the landing page carries outside the interface vocabulary. */
function everyTranslated(): Record<LocaleCode, string>[] {
  return [
    ...COMPARISON.flatMap((row) => [row.axis, row.byHand, row.withLibrary]),
    ...NOT_FOR,
    ...DOORS.flatMap((door) => [door.title, door.text]),
  ];
}

describe('the landing page content', () => {
  it('says something in every locale, everywhere', () => {
    for (const value of everyTranslated()) {
      for (const locale of LOCALES) {
        expect(
          value[locale.code]?.trim().length,
          `missing ${locale.code} in ${JSON.stringify(value)}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('translates rather than copying English across', () => {
    const values = everyTranslated();
    const identical = values.filter((value) => value.fr === value.en);

    expect(
      identical.length,
      `still English in fr: ${JSON.stringify(identical)}`,
    ).toBe(0);
  });

  it('sends every door somewhere that exists', () => {
    for (const door of DOORS) {
      if (door.slug !== undefined) {
        expect(
          findGuidePage(door.slug),
          `the "${door.title.en}" door points at the unknown page ${door.slug}`,
        ).toBeDefined();
      } else {
        expect(door.href, `the "${door.title.en}" door goes nowhere`).toMatch(
          /^https:\/\//,
        );
      }
    }
  });

  it('names no competitor: the comparison is with doing it by hand', () => {
    const prose = JSON.stringify(everyTranslated()).toLowerCase();

    for (const name of ['ngrx', 'ngxs', 'akita', 'elf', 'redux']) {
      expect(prose.includes(name), `the landing content names ${name}`).toBe(
        false,
      );
    }
  });
});
