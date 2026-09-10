import { InjectionToken } from '@angular/core';

import {
  createEffect,
  createInterceptor,
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

/**
 * Never called either, for the same reason: `createInterceptor` needs an
 * injection context, and what is under test is what the compiler accepts.
 */
function rejectedInterceptorShapes(): void {
  createInterceptor(typedActions.assigned, (value) => {
    const target: number = value;

    return target > 0;
  });

  // Returning nothing is a grant, so an observing interceptor compiles.
  createInterceptor(typedActions.cleared, () => undefined);
  createInterceptor(typedActions.assigned, () => {
    // Deliberately silent: this interceptor only looks at what passes.
  });

  // @ts-expect-error a handler cannot require a payload its action never carries
  createInterceptor(typedActions.cleared, (_value: number) => undefined);

  // @ts-expect-error a verdict is synchronous: it cannot arrive in a Promise
  createInterceptor(typedActions.assigned, () => Promise.resolve(true));

  // @ts-expect-error a numeric payload cannot become a string
  createInterceptor(typedActions.assigned, (_value: string) => true);

  createInterceptor(
    typedActions.assigned,
    () => true,
    // @ts-expect-error an interceptor has no run to govern, so it takes no options
    { concurrency: 'latest' },
  );
}

/**
 * Never called either. Fifteen plumbing types left the barrel in this change,
 * and this is what says a consumer never had to write one: every declaration
 * below compiles with no type annotation naming them, in the exact places they
 * would have been needed: a definition held in a constant, a creator held in
 * a constant, the `on` collector held in a constant, an effect handler held in
 * a constant.
 */
function inferredWithoutPlumbingTypes(): void {
  // `PayloadDefinition`, `ValuePayloadFn` and `EmptyPayloadFn` would go here.
  const withValue = payload<number>();
  const withNothing = emptyPayload;

  // `CreatorFromDefinition` and `ActionCreatorsGroup` would go here.
  const inferred = defineActionsGroup({
    source: 'Inferred',
    events: { assigned: withValue, cleared: withNothing },
  });

  // `GroupActionType` would go here, and the literal survives, which is the
  // whole reason the type exists.
  const groupType: 'INFERRED_ASSIGNED' = inferred.assigned.type;

  // `PayloadActionCreator` and `EmptyActionCreator` would go here.
  const creator = inferred.assigned;
  const emptyCreator = inferred.cleared;

  // `ActionWithPayload` and `EmptyAction` would go here.
  const carrying = creator(1);
  const bare = emptyCreator();
  const carriedPayload: number = carrying.payload;
  const bareType: string = bare.type;

  // `SingleActionType` and `ActionCreator` would go here.
  const single = defineSingleAction('INFERRED_SINGLE', (raw: string) =>
    Number(raw),
  );
  const singleType: 'INFERRED_SINGLE_ACTION' = single.type;
  const singlePayload: number = single('2').payload;

  // `On` would go here, and `StateUpdate` on the handler it collects.
  const updater = defineUpdater(TYPED_STATE, (on) => {
    const declare = on;
    // `undefined`, not `void`: the collector wants a handler that returns
    // nothing, and an extracted arrow loses the contextual typing an inline
    // one gets. `undefined` is a language keyword, not a library type, so this
    // is still a declaration written without `StateUpdate`.
    const update = (state: TypedState, value: number): undefined => {
      state.value = value;
    };

    declare(inferred.assigned, update);
    declare(inferred.cleared, (state) => {
      state.value = 0;
    });
  });

  // `EffectHandler` and `ResolvedActions` would go here.
  const handle = (value: number) => inferred.assigned(value + 1);

  createEffect(inferred.assigned, handle);

  // Read once each, so the compiler is what checks them and the linter has
  // nothing left unused.
  expect([
    groupType,
    carriedPayload,
    bareType,
    singleType,
    singlePayload,
    updater.handlers.size,
  ]).toHaveLength(6);
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

  it('rejects malformed interceptor declarations', () => {
    expect(rejectedInterceptorShapes).toBeInstanceOf(Function);
  });

  /**
   * The rule that selected what stays exported: a type stays if a consumer has
   * to write it to annotate a declaration they cannot leave inferred. None of
   * the fifteen removed here met it, and this is the proof.
   */
  it('infers every declaration without the plumbing types', () => {
    expect(inferredWithoutPlumbingTypes).toBeInstanceOf(Function);
  });
});
