import { InjectionToken } from '@angular/core';

import {
  createEffect,
  defineActionsGroup,
  defineSingleAction,
  defineUpdater,
  emptyPayload,
  payload,
} from '../public-api';
import type { Statewise } from '../lib/dispatch/statewise-ref';
import type { On } from '../lib/updater/updater-definition';

interface TypedState {
  value: number;
}

const TYPED_STATE = new InjectionToken<TypedState>('TYPED_STATE');
const typedActions = defineActionsGroup({
  source: 'Typed',
  events: {
    assigned: payload<number>(),
    cleared: emptyPayload,
  },
});
const mappedAction = defineSingleAction('MAPPED', (value: string) =>
  Number(value),
);

/**
 * Never called: these bodies exist so the compiler checks the rejections they
 * declare. The specs only assert that they were compiled.
 */
function rejectedHandlerShapes(on: On<TypedState>): void {
  // @ts-expect-error a numeric action payload cannot become a string
  on(typedActions.assigned, (_state, _value: string) => undefined);
  // @ts-expect-error an empty action handler cannot require a payload
  on(typedActions.cleared, (_state, _value: number) => undefined);
}

function rejectedDispatchShapes(ref: Statewise): void {
  ref.dispatch(typedActions.assigned(1));
  void ref.dispatchAsync(typedActions.cleared());
  // @ts-expect-error actions always require a type
  ref.dispatch({ payload: 1 });
  // @ts-expect-error assigned expects a number
  typedActions.assigned('1');
  // @ts-expect-error empty actions accept no argument
  typedActions.cleared(1);
}

/**
 * Never called either: `createEffect` needs an injection context, and what is
 * under test here is what the compiler accepts, not what runs.
 */
function rejectedEffectShapes(): void {
  createEffect(typedActions.assigned, (value, { abortSignal }) => {
    const target: number = value;

    return abortSignal.aborted
      ? typedActions.cleared()
      : typedActions.assigned(target);
  });

  createEffect(typedActions.cleared, (_none, { abortSignal }) =>
    abortSignal.aborted ? undefined : typedActions.cleared(),
  );

  createEffect(typedActions.assigned, () => undefined, {
    concurrency: 'latest',
    key: (value) => String(value),
    cancelOn: [typedActions.cleared],
    mustAnswer: true,
  });

  // An action with no payload takes every option but the key.
  createEffect(typedActions.cleared, () => undefined, {
    concurrency: 'first',
    cancelOn: typedActions.assigned,
    mustAnswer: true,
  });

  createEffect(typedActions.assigned, () => undefined, {
    // @ts-expect-error the promise to answer is a flag, not a predicate
    mustAnswer: () => true,
  });

  createEffect(typedActions.assigned, () => undefined, {
    // @ts-expect-error only the three declared policies exist
    concurrency: 'switchMap',
  });

  createEffect(typedActions.assigned, () => undefined, {
    // @ts-expect-error a concurrency key is a string
    key: (value) => value,
  });

  createEffect(typedActions.cleared, () => undefined, {
    // @ts-expect-error an action with no payload has nothing to key runs by
    key: () => 'only',
  });

  // @ts-expect-error a handler cannot require a payload its action never carries
  createEffect(typedActions.cleared, (_value: number) => undefined);
}

describe('public API types', () => {
  it('preserves action payload and updater handler types', () => {
    const updater = defineUpdater(TYPED_STATE, (on) => {
      on(typedActions.assigned, (state, value) => {
        const stateValue: number = state.value;
        const payloadValue: number = value;
        state.value = stateValue + payloadValue;
      });
      on(typedActions.cleared, (state) => {
        state.value = 0;
      });
      on(mappedAction, (state, value) => {
        const mappedValue: number = value;
        state.value = mappedValue;
      });
    });

    expect(updater.handlers.size).toBe(3);
    expect(rejectedHandlerShapes).toBeInstanceOf(Function);
  });

  it('rejects malformed actions at the Statewise boundary', () => {
    expect(rejectedDispatchShapes).toBeInstanceOf(Function);
  });

  it('rejects malformed effect declarations', () => {
    expect(rejectedEffectShapes).toBeInstanceOf(Function);
  });
});
