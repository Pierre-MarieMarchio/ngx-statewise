import {
  assertInInjectionContext,
  ErrorHandler,
  inject,
  Injector,
} from '@angular/core';

import { indexUpdaters, resolveUpdaters } from '../updater/resolve-updaters';
import type { Updater } from '../updater/updater-definition';
import type { DispatchScope } from './dispatch-scope';
import { StatewiseEngine } from './statewise-engine';
import { ScopedStatewiseRef, type Statewise } from './statewise-ref';

/**
 * Attaches the given updaters to the current injection context and returns the
 * handle used to dispatch actions.
 *
 * Their states are read once, from the injector of the caller, so two managers
 * declaring the same action type keep separate states.
 *
 * @param updaters - The updaters this manager owns.
 * @returns A dispatch handle scoped to those updaters.
 */
export function injectStatewise(...updaters: Updater<unknown>[]): Statewise {
  assertInInjectionContext(injectStatewise);

  const injector = inject(Injector);
  const engine = inject(StatewiseEngine);
  const errorHandler = inject(ErrorHandler);
  const scope: DispatchScope = {
    updaters: indexUpdaters(resolveUpdaters(injector, updaters)),
  };

  return new ScopedStatewiseRef(engine, scope, errorHandler);
}
