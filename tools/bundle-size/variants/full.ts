import * as statewise from 'ngx-statewise';

/**
 * Every public export, retained.
 *
 * `Object.keys` over a namespace import is what stops the optimizer from
 * dropping the ones this file does not call: the whole barrel has to exist at
 * runtime for the expression below to be answerable.
 */
export function subject(): string {
  return Object.keys(statewise).sort().join(' ');
}
