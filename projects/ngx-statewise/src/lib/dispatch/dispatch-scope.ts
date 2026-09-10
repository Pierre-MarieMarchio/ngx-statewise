import type { StateBoundHandler } from '../updater/updater-definition';

/**
 * The updaters a dispatch may apply. Each `injectStatewise` call owns its own
 * scope object, whose identity also isolates the effects it starts: two
 * concurrent dispatches of the same action share neither state nor observation.
 */
export interface DispatchScope {
  readonly updaters: ReadonlyMap<string, StateBoundHandler>;
}
