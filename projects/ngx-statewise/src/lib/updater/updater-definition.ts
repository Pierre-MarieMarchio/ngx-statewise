import type { ProviderToken } from '@angular/core';

import type { ActionPayloadOf, AnyActionCreator } from '../action';

/**
 * What you write inside `on(...)`: how one action changes the state.
 *
 * It must stay synchronous and return nothing, so the state is settled before
 * effects run. An `async` handler is rejected at compile time.
 */
export type StateUpdate<State, Creator extends AnyActionCreator> = [
  ActionPayloadOf<Creator>,
] extends [never]
  ? (state: State) => undefined
  : (state: State, payload: ActionPayloadOf<Creator>) => undefined;

/** Registers one handler inside `defineUpdater`. */
export type On<State> = <Creator extends AnyActionCreator>(
  action: Creator,
  handler: StateUpdate<State, Creator>,
) => void;

/** A handler once stored, with the action creator's typing erased. */
export interface ErasedUpdate<State> {
  update(state: State, payload: unknown): void;
}

/** What `defineUpdater` returns: a declaration, not yet bound to a state. */
export interface Updater<State> {
  readonly stateToken: ProviderToken<State>;
  readonly handlers: ReadonlyMap<string, ErasedUpdate<State>>;
}

/** An updater whose state has been read from an injector. */
export interface InjectedUpdater<State = unknown> {
  readonly state: State;
  readonly handlers: ReadonlyMap<string, ErasedUpdate<State>>;
}

/**
 * One handler already paired with the state it updates, which is what a
 * dispatch scope indexes: a single lookup, no second resolution step.
 */
export interface StateBoundHandler {
  readonly state: unknown;
  apply(payload: unknown): void;
}
