import { InjectionToken } from '@angular/core';

/**
 * Turns the misrouted-dispatch check on. Defaults to Angular's dev mode: the
 * check costs a set lookup and only runs when no updater matched, but it
 * throws, so production keeps the lenient behaviour.
 */
export const STRICT_DISPATCH = new InjectionToken<boolean>('STRICT_DISPATCH');

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
