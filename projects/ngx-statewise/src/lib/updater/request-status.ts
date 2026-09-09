import type { WritableSignal } from '@angular/core';

import type { AnyActionCreator } from '../action';
import type { On, StateUpdate } from './updater-definition';

/**
 * A `request` / `success` / `failure` group, whatever its payloads carry.
 *
 * A group declared by `defineActionsGroup` with those three events satisfies
 * this by construction, and the generic is what carries their payload types
 * through to the handlers below.
 */
interface RequestActions {
  readonly request: AnyActionCreator;
  readonly success: AnyActionCreator;
  readonly failure: AnyActionCreator;
}

/**
 * What `requestStatus` needs, and what it lets you add.
 *
 * The two flags are read from the state rather than written through setters,
 * because signals are the shape the guide tells you to reach for. An updater
 * holding plain properties writes its three handlers by hand — this helper is
 * entirely optional and does not narrow what the library supports.
 *
 * The three handlers are optional and take the payload of their own action.
 * They exist because `defineUpdater` allows one handler per action type, so
 * without them, adopting this helper would mean giving up everything else
 * those three actions do — starting with the data a `success` carries.
 */
interface RequestStatus<State, Actions extends RequestActions> {
  readonly loading: (state: State) => WritableSignal<boolean>;
  readonly error: (state: State) => WritableSignal<boolean>;
  readonly onRequest?: StateUpdate<State, Actions['request']>;
  readonly onSuccess?: StateUpdate<State, Actions['success']>;
  readonly onFailure?: StateUpdate<State, Actions['failure']>;
}

/**
 * Wires the three handlers of a request flow onto two flags.
 *
 * Called inside `defineUpdater`, with its `on`, so `defineUpdater` keeps its
 * signature and nothing about this is mandatory:
 *
 * ```typescript
 * export const taskUpdater = defineUpdater(TaskState, (on) => {
 *   requestStatus(on, getAllTaskActions, {
 *     loading: (state) => state.isLoading,
 *     error: (state) => state.isError,
 *     onSuccess: (state, tasks) => {
 *       state.tasks.set(tasks);
 *     },
 *   });
 * });
 * ```
 *
 * The flags are written first, then your handler runs — so it sees them
 * already settled and can overrule one if it has to.
 *
 * The guarantee that earns this helper its place: **`request` clears the error
 * of the previous attempt.** Forgetting that one line by hand is not
 * hypothetical — this repository's own showcase shipped it, and a reload that
 * succeeded left a stale failure on screen until the next logout, with no test
 * noticing.
 *
 * What it deliberately does not cover: a flow whose rollback point is per
 * entity, or whose failure has to reconcile an optimistic write. Those are
 * still three handlers written by hand, and they should be.
 */
export function requestStatus<State, Actions extends RequestActions>(
  on: On<State>,
  actions: Actions,
  status: RequestStatus<State, Actions>,
): void {
  on(actions.request, (state, payload) => {
    status.loading(state).set(true);

    // Not a convenience: an attempt that has started has not failed, and
    // leaving the previous failure up is the bug this helper exists to make
    // unwritable.
    status.error(state).set(false);

    apply(status.onRequest, state, payload);
  });

  on(actions.success, (state, payload) => {
    status.loading(state).set(false);

    apply(status.onSuccess, state, payload);
  });

  on(actions.failure, (state, payload) => {
    status.loading(state).set(false);
    status.error(state).set(true);

    apply(status.onFailure, state, payload);
  });
}

/**
 * Runs one of the optional handlers, if it was given.
 *
 * Takes it erased, and for the same reason `defineUpdater` erases the handlers
 * it stores: `StateUpdate` resolves to one of two arities depending on whether
 * the action carries a payload, and that distinction is checked where the
 * caller writes the handler. This is past that point, and a handler declaring
 * fewer parameters than it is called with is exactly what JavaScript allows.
 */
function apply(handler: unknown, state: unknown, payload: unknown): void {
  const erased = handler as
    ((state: unknown, payload: unknown) => undefined) | undefined;

  erased?.(state, payload);
}
