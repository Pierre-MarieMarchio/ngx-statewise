import { EMPTY, of, throwError } from 'rxjs';

import { resolveEffectOutcome } from './effect-outcome';

const first = { type: 'FIRST' } as const;
const second = { type: 'SECOND', payload: 2 } as const;

describe('resolveEffectOutcome', () => {
  it('yields no action when the effect returns nothing', async () => {
    await expectAsync(resolveEffectOutcome(undefined)).toBeResolvedTo([]);
    await expectAsync(
      resolveEffectOutcome(null as unknown as undefined),
    ).toBeResolvedTo([]);
  });

  it('wraps a single action and keeps an array of actions as is', async () => {
    await expectAsync(resolveEffectOutcome(first)).toBeResolvedTo([first]);
    await expectAsync(resolveEffectOutcome([first, second])).toBeResolvedTo([
      first,
      second,
    ]);
    await expectAsync(resolveEffectOutcome([])).toBeResolvedTo([]);
  });

  it('awaits promised results, including a promised Observable', async () => {
    await expectAsync(
      resolveEffectOutcome(Promise.resolve(second)),
    ).toBeResolvedTo([second]);
    await expectAsync(
      resolveEffectOutcome(Promise.resolve(undefined)),
    ).toBeResolvedTo([]);
    await expectAsync(
      resolveEffectOutcome(Promise.resolve(of(second))),
    ).toBeResolvedTo([second]);
  });

  it('reads an Observable as a one-shot source', async () => {
    await expectAsync(resolveEffectOutcome(of(first))).toBeResolvedTo([first]);
    await expectAsync(resolveEffectOutcome(of([first, second]))).toBeResolvedTo(
      [first, second],
    );
    await expectAsync(resolveEffectOutcome(of(first, second))).toBeResolvedTo([
      first,
    ]);
  });

  it('accepts an empty Observable as a result without action', async () => {
    await expectAsync(resolveEffectOutcome(EMPTY)).toBeResolvedTo([]);
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
      expect(outcome instanceof globalThis.Promise).toBeFalse();
      await expectAsync(resolveEffectOutcome(outcome)).toBeResolvedTo([second]);
    } finally {
      globalThis.Promise = intrinsic;
    }
  });

  it('propagates the failure of a promise or of an Observable', async () => {
    const failure = new Error('effect failure');

    await expectAsync(
      resolveEffectOutcome(Promise.reject(failure)),
    ).toBeRejectedWith(failure);
    await expectAsync(
      resolveEffectOutcome(throwError(() => failure)),
    ).toBeRejectedWith(failure);
  });
});
