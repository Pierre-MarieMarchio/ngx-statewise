/**
 * The first entry a spec expects a collection to hold.
 *
 * Indexing or destructuring hands back `Value | undefined` under
 * `noUncheckedIndexedAccess`, and the library forbids `!`, so what a spec used
 * to assume it now states: an empty collection fails here, with a sentence,
 * rather than further down as a confusing read of `undefined`.
 */
export function firstEntry<Value>(values: readonly Value[]): Value {
  const [head] = values;

  if (head === undefined) {
    throw new Error('expected at least one entry, got none');
  }

  return head;
}
