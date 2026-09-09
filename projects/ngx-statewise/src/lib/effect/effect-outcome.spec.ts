import { EMPTY, of, Subject, throwError } from 'rxjs';

import type { Action } from '../action';
import { resolveEffectOutcome, type EffectOutcome } from './effect-outcome';

const first = { type: 'FIRST' } as const;
const second = { type: 'SECOND', payload: 2 } as const;

/** Resolves an outcome whose run is never abandoned. */
function resolve(outcome: EffectOutcome): Promise<readonly Action[]> {
  return resolveEffectOutcome(outcome, new AbortController().signal);
}

describe('resolveEffectOutcome', () => {
  it('yields no action when the effect returns nothing', async () => {
    await expect(resolve(undefined)).resolves.toEqual([]);
    await expect(resolve(null as unknown as undefined)).resolves.toEqual([]);
  });

  it('wraps a single action and keeps an array of actions as is', async () => {
    await expect(resolve(first)).resolves.toEqual([first]);
    await expect(resolve([first, second])).resolves.toEqual([first, second]);
    await expect(resolve([])).resolves.toEqual([]);
  });

  it('awaits promised results, including a promised Observable', async () => {
    await expect(resolve(Promise.resolve(second))).resolves.toEqual([second]);
    await expect(resolve(Promise.resolve(undefined))).resolves.toEqual([]);
    await expect(resolve(Promise.resolve(of(second)))).resolves.toEqual([
      second,
    ]);
  });

  it('reads an Observable as a one-shot source', async () => {
    await expect(resolve(of(first))).resolves.toEqual([first]);
    await expect(resolve(of([first, second]))).resolves.toEqual([
      first,
      second,
    ]);
    await expect(resolve(of(first, second))).resolves.toEqual([first]);
  });

  it('accepts an empty Observable as a result without action', async () => {
    await expect(resolve(EMPTY)).resolves.toEqual([]);
  });

  /**
   * An `async` handler returns a promise built by the intrinsic constructor,
   * while `zone.js` replaces the global one with `ZoneAwarePromise`. Recognizing
   * a promise by identity would drop the actions of every such effect, so the
   * mismatch is reproduced here with a constructor the promise is not an
   * instance of.
   */
  it('awaits a promise that is not an instance of the global Promise', async () => {
    const intrinsic = globalThis.Promise;
    const outcome = intrinsic.resolve(second);

    class ForeignPromise<Value> extends intrinsic<Value> {}
    globalThis.Promise = ForeignPromise;

    try {
      expect(outcome instanceof globalThis.Promise).toBe(false);
      await expect(resolve(outcome)).resolves.toEqual([second]);
    } finally {
      globalThis.Promise = intrinsic;
    }
  });

  it('propagates the failure of a promise or of an Observable', async () => {
    const failure = new Error('effect failure');

    await expect(resolve(Promise.reject(failure))).rejects.toEqual(failure);
    await expect(resolve(throwError(() => failure))).rejects.toEqual(failure);
  });
  describe('an abandoned run', () => {
    /** What the engine hands over once a newer run has superseded this one. */
    function abandoned(): AbortSignal {
      const controller = new AbortController();
      controller.abort();

      return controller.signal;
    }

    it('yields no action when it is abandoned before it is read', async () => {
      await expect(
        resolveEffectOutcome(Promise.resolve(first), abandoned()),
      ).resolves.toEqual([]);
      await expect(
        resolveEffectOutcome(of(first), abandoned()),
      ).resolves.toEqual([]);
    });

    it('drops the answer of a promise abandoned while in flight', async () => {
      const controller = new AbortController();
      let settle!: (action: Action) => void;
      const inFlight = new Promise<Action>((resolve) => {
        settle = resolve;
      });

      const outcome = resolveEffectOutcome(inFlight, controller.signal);
      controller.abort();

      await expect(outcome).resolves.toEqual([]);

      // The work goes on — a promise cannot be cancelled — and answers into
      // the void.
      settle(first);
      await inFlight;
    });

    /**
     * The one cancellation the library can genuinely perform: unsubscribing is
     * what aborts an `HttpClient` request, where an awaited promise can only be
     * ignored.
     */
    it('unsubscribes from a source abandoned while in flight', async () => {
      const controller = new AbortController();
      const source = new Subject<Action>();

      const outcome = resolveEffectOutcome(source, controller.signal);
      expect(source.observed).toBe(true);

      controller.abort();

      await expect(outcome).resolves.toEqual([]);
      expect(source.observed).toBe(false);
    });

    it('never subscribes to a source it is handed already abandoned', async () => {
      const source = new Subject<Action>();

      await expect(resolveEffectOutcome(source, abandoned())).resolves.toEqual(
        [],
      );
      expect(source.observed).toBe(false);
    });

    it('swallows a failure arriving after the abandon', async () => {
      const controller = new AbortController();
      let fail!: (reason: Error) => void;
      const inFlight = new Promise<Action>((_, reject) => {
        fail = reject;
      });

      const outcome = resolveEffectOutcome(inFlight, controller.signal);
      controller.abort();
      await expect(outcome).resolves.toEqual([]);

      // Observed by the resolution above, so this rejection never escapes as
      // an unhandled one.
      fail(new Error('answer nobody awaits'));
      await expect(inFlight).rejects.toThrow('answer nobody awaits');
    });
  });
});
