/**
 * Every action type claimed by an updater, recorded at declaration time.
 *
 * Filling this when the updater is declared rather than when it is attached is
 * what makes the misrouted-dispatch check reliable: a type is known as soon as
 * its module is loaded, whether or not the manager owning it was ever injected.
 */
const declaredTypes = new Set<string>();

export function declareUpdaterActionTypes(types: Iterable<string>): void {
  for (const type of types) {
    declaredTypes.add(type);
  }
}

export function isUpdaterActionTypeDeclared(type: string): boolean {
  return declaredTypes.has(type);
}

/**
 * Snapshot and restore, rather than a plain reset: declarations happen when an
 * updater module is loaded and never happen again, so clearing them outright
 * would silently disable the check for every later test in the same bundle.
 */
export function snapshotUpdaterActionTypes(): readonly string[] {
  return [...declaredTypes];
}

export function restoreUpdaterActionTypes(types: readonly string[]): void {
  declaredTypes.clear();
  declareUpdaterActionTypes(types);
}
