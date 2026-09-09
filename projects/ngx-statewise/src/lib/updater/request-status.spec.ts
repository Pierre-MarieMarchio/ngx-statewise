import { InjectionToken, signal } from '@angular/core';

import { defineActionsGroup, emptyPayload, payload } from '../action';
import { defineUpdater } from './define-updater';
import { requestStatus } from './request-status';

interface LoadState {
  readonly isLoading: ReturnType<typeof signal<boolean>>;
  readonly isError: ReturnType<typeof signal<boolean>>;
  readonly items: ReturnType<typeof signal<readonly string[]>>;
}

const LOAD_STATE = new InjectionToken<LoadState>('LOAD_STATE');

const loadActions = defineActionsGroup({
  source: 'requestStatusProbe',
  events: {
    request: emptyPayload,
    success: payload<readonly string[]>(),
    failure: emptyPayload,
  },
});

function loadState(): LoadState {
  return {
    isLoading: signal(false),
    isError: signal(false),
    items: signal<readonly string[]>([]),
  };
}

const loadUpdater = defineUpdater(LOAD_STATE, (on) => {
  requestStatus(on, loadActions, {
    loading: (state) => state.isLoading,
    error: (state) => state.isError,
  });
});

describe('requestStatus', () => {
  let state: LoadState;

  /** Applies one action the way a dispatch scope would. */
  function apply(actionType: string, payloadValue?: unknown): void {
    const handler = loadUpdater.handlers.get(actionType);

    if (handler === undefined) {
      throw new Error(`no handler registered for "${actionType}"`);
    }

    handler.update(state, payloadValue);
  }

  beforeEach(() => {
    state = loadState();
  });

  it('raises the loading flag on the request and drops it on the success', () => {
    apply(loadActions.request.type);
    expect(state.isLoading()).toBe(true);

    apply(loadActions.success.type, ['first']);

    expect(state.isLoading()).toBe(false);
    expect(state.isError()).toBe(false);
  });

  it('raises the error flag on the failure and drops the loading one', () => {
    apply(loadActions.request.type);

    apply(loadActions.failure.type);

    expect(state.isLoading()).toBe(false);
    expect(state.isError()).toBe(true);
  });

  /**
   * The guarantee that earns this helper its place. Written by hand, this is
   * the line people forget: the showcase shipped a flow whose `request` never
   * cleared the flag, so a reload that succeeded left a stale failure on
   * screen until the next logout — and no test noticed.
   */
  it('clears the error of the previous attempt when a new one starts', () => {
    apply(loadActions.request.type);
    apply(loadActions.failure.type);
    expect(state.isError()).toBe(true);

    apply(loadActions.request.type);

    expect(state.isError()).toBe(false);
    expect(state.isLoading()).toBe(true);
  });

  /**
   * `defineUpdater` allows one handler per action type, so a helper that took
   * all three and gave nothing back would mean giving up the data a `success`
   * carries. This is what makes it adoptable rather than merely available.
   */
  it('runs the handler given for a success, with its own payload', () => {
    const carrying = defineUpdater(LOAD_STATE, (on) => {
      requestStatus(on, loadActions, {
        loading: (current) => current.isLoading,
        error: (current) => current.isError,
        onSuccess: (current, items) => {
          current.items.set(items);
        },
      });
    });

    carrying.handlers
      .get(loadActions.success.type)
      ?.update(state, ['kept', 'both']);

    expect(state.items()).toEqual(['kept', 'both']);
    expect(state.isLoading()).toBe(false);
  });

  /**
   * The flags settle before the handler runs, so a flow that has a reason to
   * disagree with one of them can say so — and a reader knows which write
   * wins without having to look here.
   */
  it('settles the flags before running the handler', () => {
    const seen: boolean[] = [];
    const observing = defineUpdater(LOAD_STATE, (on) => {
      requestStatus(on, loadActions, {
        loading: (current) => current.isLoading,
        error: (current) => current.isError,
        onRequest: (current) => {
          seen.push(current.isLoading(), current.isError());
        },
      });
    });

    state.isError.set(true);
    observing.handlers.get(loadActions.request.type)?.update(state, undefined);

    expect(seen).toEqual([true, false]);
  });
});
