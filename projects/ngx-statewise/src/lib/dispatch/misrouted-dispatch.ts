import { InjectionToken } from '@angular/core';

/**
 * What the engine does when a dispatch reaches a scope that does not own the
 * updater of its action type.
 *
 * The detection itself always runs. It costs a set lookup, and only when no
 * updater matched. Only the reaction changes: development throws, so the
 * mistake is impossible to miss, while production reports and carries on,
 * because breaking a running application over it would be worse than the
 * missing state update. `'ignore'` restores the pre-detection silence, and
 * exists for tests that dispatch on purpose without attaching an updater.
 */
export type MisroutedDispatchReaction = 'throw' | 'report' | 'ignore';

/** Selects the reaction. Defaults to Angular's dev mode. */
export const MISROUTED_DISPATCH_REACTION =
  new InjectionToken<MisroutedDispatchReaction>('MISROUTED_DISPATCH_REACTION');

/**
 * The reaction to use when the application did not choose one.
 *
 * Takes the dev-mode flag rather than reading it, so both arms are
 * reachable from a test: a `TestBed` always runs in development mode.
 */
export function defaultMisroutedDispatchReaction(
  devMode: boolean,
): MisroutedDispatchReaction {
  return devMode ? 'throw' : 'report';
}

/** Raised when an action reached a scope that does not own its updater. */
export function misroutedActionError(actionType: string): Error {
  return new Error(
    `[ngx-statewise] No updater in scope for "${actionType}". This action ` +
      `type is handled by an updater attached to another injectStatewise() ` +
      `scope, so this dispatch would silently skip its state update. ` +
      `Dispatch it through the manager owning that updater, or declare that ` +
      `updater globally with provideStatewise({ updaters: [...] }).`,
  );
}
