import * as statewise from 'ngx-statewise';

/**
 * Every public export, retained.
 *
 * `Object.keys` over a namespace import is what stops the optimizer from
 * dropping the ones this file does not call: the whole barrel has to exist at
 * runtime for the expression below to be answerable.
 */
export function subject(): string {
  // `localeCompare` rather than the default sort: the default compares the
  // string forms of whatever it is given, which is only accidentally right for
  // strings — and this list decides what a measured bundle contains.
  return Object.keys(statewise)
    .sort((left, right) => left.localeCompare(right))
    .join(' ');
}
