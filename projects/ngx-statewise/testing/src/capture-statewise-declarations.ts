import {
  ɵrestoreUpdaterActionTypes,
  ɵsnapshotUpdaterActionTypes,
} from 'ngx-statewise';

/**
 * Records the updater declarations known right now, and returns the function
 * restoring them.
 *
 * Only useful for a suite calling `defineUpdater` inside its tests: it keeps a
 * type declared by one test from being reported as misrouted in the next. When
 * you simply want the misrouted-dispatch check off, prefer
 * `provideStatewiseTesting({ strict: false })`.
 *
 * @example
 * let restoreDeclarations: () => void;
 * beforeEach(() => (restoreDeclarations = captureStatewiseDeclarations()));
 * afterEach(() => restoreDeclarations());
 */
export function captureStatewiseDeclarations(): () => void {
  const snapshot = ɵsnapshotUpdaterActionTypes();

  return (): void => {
    ɵrestoreUpdaterActionTypes(snapshot);
  };
}
