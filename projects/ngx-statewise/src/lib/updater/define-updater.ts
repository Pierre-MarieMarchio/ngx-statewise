import type { ProviderToken } from '@angular/core';

import type { AnyActionCreator } from '../action';
import { declareUpdaterActionTypes } from './declared-action-types';
import { duplicateHandlerInUpdaterError } from './duplicate-handler-error';
import type {
  ErasedUpdate,
  On,
  StateUpdate,
  Updater,
} from './updater-definition';

/**
 * Declares how a state reacts to actions. The state itself is read from the
 * injector when the updater is attached to a dispatch scope.
 *
 * @param stateToken - Injectable token holding the state instance.
 * @param configure - Callback registering one handler per action.
 * @returns The updater, to pass to `injectStatewise` or `provideStatewise`.
 */
export function defineUpdater<State>(
  stateToken: ProviderToken<State>,
  configure: (on: On<State>) => void,
): Updater<State> {
  const handlers = new Map<string, ErasedUpdate<State>>();

  const on: On<State> = <Creator extends AnyActionCreator>(
    action: Creator,
    handler: StateUpdate<State, Creator>,
  ): void => {
    if (handlers.has(action.type)) {
      throw duplicateHandlerInUpdaterError(action.type);
    }

    handlers.set(action.type, {
      update(state, payload): void {
        Reflect.apply(handler, undefined, [state, payload]);
      },
    });
  };

  configure(on);
  declareUpdaterActionTypes(handlers.keys());

  return { stateToken, handlers };
}
