/**
 * The entry a spec expects a collection to hold at that position.
 *
 * Indexing hands back `Value | undefined` under `noUncheckedIndexedAccess`, so
 * what a spec used to assume it now states: a collection too short fails here,
 * with a sentence, rather than further down as a confusing read of `undefined`.
 */
export function at<Value>(values: readonly Value[], index = 0): Value {
  const value = values[index];

  if (value === undefined) {
    throw new Error(
      `expected an entry at ${String(index)}, got a collection of ${String(values.length)}`,
    );
  }

  return value;
}
