import { PendingEffects } from './pending-effects';

interface Gate {
  readonly promise: Promise<void>;
  readonly open: () => void;
  readonly fail: (reason: unknown) => void;
}

function gate(): Gate {
  let open!: () => void;
  let fail!: (reason: unknown) => void;
  const promise = new Promise<void>((resolve, reject) => {
    open = () => {
      resolve();
    };
    fail = reject;
  });

  return { promise, open, fail };
}

/**
 * The action types the instance still holds, read from inside it.
 *
 * A retention invariant has no observable surface, since `waitFor` resolves
 * on a finished occurrence whether or not its entry was dropped, so the only
 * assertion that can hold it is one that knows the shape of the class it
 * tests.
 */
function trackedTypes(pending: PendingEffects): ReadonlyMap<string, unknown> {
  return (pending as unknown as { readonly pending: Map<string, unknown> })
    .pending;
}

describe('PendingEffects', () => {
  const scope = {};
  const otherScope = {};
  let pending: PendingEffects;

  beforeEach(() => {
    pending = new PendingEffects();
  });

  it('resolves immediately when nothing is pending', async () => {
    await expect(pending.waitFor(scope, 'UNKNOWN')).resolves.not.toThrow();
    await expect(pending.waitForScope(scope)).resolves.not.toThrow();
    await expect(pending.waitForAll()).resolves.not.toThrow();
  });

  it('returns the tracked effect untouched', async () => {
    const tracked = Promise.resolve();

    expect(pending.track(scope, 'DONE', tracked)).toBe(tracked);
    await tracked;
  });

  it('waits for one action type without waiting for the others', async () => {
    const first = gate();
    const second = gate();
    let matchingSettled = false;
    let scopeSettled = false;

    void pending.track(scope, 'FIRST', first.promise);
    void pending.track(scope, 'SECOND', second.promise);
    const matching = pending.waitFor(scope, 'FIRST').then(() => {
      matchingSettled = true;
    });
    const whole = pending.waitForScope(scope).then(() => {
      scopeSettled = true;
    });

    first.open();
    await matching;
    expect(matchingSettled).toBe(true);
    expect(scopeSettled).toBe(false);

    second.open();
    await whole;
    expect(scopeSettled).toBe(true);
  });

  it('waits for every occurrence of the same action type', async () => {
    const first = gate();
    const second = gate();
    let settled = false;

    void pending.track(scope, 'SAME', first.promise);
    void pending.track(scope, 'SAME', second.promise);
    const waiting = pending.waitFor(scope, 'SAME').then(() => {
      settled = true;
    });

    first.open();
    await first.promise;
    expect(settled).toBe(false);

    second.open();
    await waiting;
    expect(settled).toBe(true);
  });

  describe('scope isolation', () => {
    it('ignores the occurrences of another scope, per type and as a whole', async () => {
      const other = gate();
      void pending.track(otherScope, 'SHARED_TYPE', other.promise);

      await expect(
        pending.waitFor(scope, 'SHARED_TYPE'),
      ).resolves.not.toThrow();
      await expect(pending.waitForScope(scope)).resolves.not.toThrow();

      other.open();
      await other.promise;
    });

    it('waits for every scope through the unscoped view', async () => {
      const other = gate();
      let settled = false;
      void pending.track(otherScope, 'SHARED_TYPE', other.promise);

      const waiting = pending.waitForAll().then(() => {
        settled = true;
      });

      await Promise.resolve();
      expect(settled).toBe(false);

      other.open();
      await waiting;
      expect(settled).toBe(true);
    });

    it('keeps the two scopes of one action type apart', async () => {
      const mine = gate();
      const theirs = gate();
      let mineSettled = false;
      void pending.track(scope, 'SHARED_TYPE', mine.promise);
      void pending.track(otherScope, 'SHARED_TYPE', theirs.promise);

      const waiting = pending.waitFor(scope, 'SHARED_TYPE').then(() => {
        mineSettled = true;
      });

      mine.open();
      await waiting;
      expect(mineSettled).toBe(true);

      theirs.open();
      await theirs.promise;
    });
  });

  it('forgets an occurrence once it is over', async () => {
    const finished = Promise.resolve();

    void pending.track(scope, 'DONE', finished);
    await finished;

    await expect(pending.waitFor(scope, 'DONE')).resolves.not.toThrow();
    await expect(pending.waitForAll()).resolves.not.toThrow();
  });

  /**
   * The costly one of the two retention invariants. This map is strong, and
   * every entry holds the dispatch scope it was tagged with, and hence,
   * through `StateBoundHandler.state`, the consumer's own state objects. Left
   * unpurged, an application accumulates one entry per dispatch, for ever,
   * with nothing observable to show for it.
   */
  it('drops the entry of an action type once its last occurrence is over', async () => {
    const finished = Promise.resolve();

    void pending.track(scope, 'DONE', finished);
    await finished;

    // The purge is a continuation of the tracked promise, queued behind the
    // one this test is waiting on.
    await Promise.resolve();

    expect(trackedTypes(pending).size).toBe(0);
  });

  it('forgets a failed occurrence without hiding its error', async () => {
    const failure = new Error('pending failure');
    const tracked = pending.track(scope, 'FAILED', Promise.reject(failure));

    await expect(tracked).rejects.toEqual(failure);
    await expect(pending.waitFor(scope, 'FAILED')).resolves.not.toThrow();
  });

  it('reports completion, not success, to unrelated observers', async () => {
    const failing = gate();
    const tracked = pending.track(scope, 'FAILING', failing.promise);
    const waiting = pending.waitForScope(scope);

    failing.fail(new Error('unobserved failure'));

    await expect(waiting).resolves.not.toThrow();
    await expect(tracked).rejects.toThrow();
  });
});
