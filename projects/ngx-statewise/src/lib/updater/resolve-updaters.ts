import type { Injector } from '@angular/core';

import { conflictingUpdatersError } from './duplicate-handler-error';
import type {
  ErasedUpdate,
  InjectedUpdater,
  StateBoundHandler,
  Updater,
} from './updater-definition';

/** Reads each updater's state from the injector of the caller. */
export function resolveUpdaters(
  injector: Injector,
  updaters: readonly Updater<unknown>[],
): readonly InjectedUpdater[] {
  return updaters.map((updater) => ({
    state: injector.get(updater.stateToken),
    handlers: updater.handlers,
  }));
}

/**
 * Indexes the handlers by action type, each already paired with its state, so
 * a dispatch resolves what it must run in a single lookup.
 */
export function indexUpdaters(
  updaters: readonly InjectedUpdater[],
): ReadonlyMap<string, StateBoundHandler> {
  const index = new Map<string, StateBoundHandler>();

  for (const updater of updaters) {
    for (const [actionType, handler] of updater.handlers) {
      if (index.has(actionType)) {
        throw conflictingUpdatersError(actionType);
      }

      index.set(actionType, bindToState(updater.state, handler));
    }
  }

  return index;
}

function bindToState(
  state: unknown,
  handler: ErasedUpdate<unknown>,
): StateBoundHandler {
  return {
    state,
    apply: (payload: unknown): void => {
      handler.update(state, payload);
    },
  };
}
