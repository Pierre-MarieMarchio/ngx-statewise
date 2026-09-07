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
