import { EMPTY, of, throwError } from 'rxjs';

import { resolveEffectOutcome } from './effect-outcome';

const first = { type: 'FIRST' } as const;
const second = { type: 'SECOND', payload: 2 } as const;

describe('resolveEffectOutcome', () => {
  it('yields no action when the effect returns nothing', async () => {
    await expect(resolveEffectOutcome(undefined)).resolves.toEqual([]);
    await expect(
      resolveEffectOutcome(null as unknown as undefined),
    ).resolves.toEqual([]);
  });

  it('wraps a single action and keeps an array of actions as is', async () => {
    await expect(resolveEffectOutcome(first)).resolves.toEqual([first]);
    await expect(resolveEffectOutcome([first, second])).resolves.toEqual([
      first,
      second,
    ]);
    await expect(resolveEffectOutcome([])).resolves.toEqual([]);
  });

  it('awaits promised results, including a promised Observable', async () => {
    await expect(
      resolveEffectOutcome(Promise.resolve(second)),
    ).resolves.toEqual([second]);
    await expect(
      resolveEffectOutcome(Promise.resolve(undefined)),
    ).resolves.toEqual([]);
    await expect(
      resolveEffectOutcome(Promise.resolve(of(second))),
    ).resolves.toEqual([second]);
  });

  it('reads an Observable as a one-shot source', async () => {
    await expect(resolveEffectOutcome(of(first))).resolves.toEqual([first]);
    await expect(resolveEffectOutcome(of([first, second]))).resolves.toEqual([
      first,
      second,
    ]);
    await expect(resolveEffectOutcome(of(first, second))).resolves.toEqual([
      first,
    ]);
  });

  it('accepts an empty Observable as a result without action', async () => {
    await expect(resolveEffectOutcome(EMPTY)).resolves.toEqual([]);
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
      await expect(resolveEffectOutcome(outcome)).resolves.toEqual([second]);
    } finally {
      globalThis.Promise = intrinsic;
    }
  });

  it('propagates the failure of a promise or of an Observable', async () => {
    const failure = new Error('effect failure');

    await expect(resolveEffectOutcome(Promise.reject(failure))).rejects.toEqual(
      failure,
    );
    await expect(
      resolveEffectOutcome(throwError(() => failure)),
    ).rejects.toEqual(failure);
  });
});
