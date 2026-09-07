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

describe('PendingEffects', () => {
  const scope = {};
  const otherScope = {};
  let pending: PendingEffects;

  beforeEach(() => {
    pending = new PendingEffects();
  });

  it('resolves immediately when nothing is pending', async () => {
    await expectAsync(pending.waitFor(scope, 'UNKNOWN')).toBeResolved();
    await expectAsync(pending.waitForScope(scope)).toBeResolved();
    await expectAsync(pending.waitForAll()).toBeResolved();
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
    expect(matchingSettled).toBeTrue();
    expect(scopeSettled).toBeFalse();

    second.open();
    await whole;
    expect(scopeSettled).toBeTrue();
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
    expect(settled).toBeFalse();

    second.open();
    await waiting;
    expect(settled).toBeTrue();
  });

  describe('scope isolation', () => {
    it('ignores the occurrences of another scope, per type and as a whole', async () => {
      const other = gate();
      void pending.track(otherScope, 'SHARED_TYPE', other.promise);

      await expectAsync(pending.waitFor(scope, 'SHARED_TYPE')).toBeResolved();
      await expectAsync(pending.waitForScope(scope)).toBeResolved();

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
      expect(settled).toBeFalse();

      other.open();
      await waiting;
      expect(settled).toBeTrue();
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
      expect(mineSettled).toBeTrue();

      theirs.open();
      await theirs.promise;
    });
  });

  it('forgets an occurrence once it is over', async () => {
    const finished = Promise.resolve();

    void pending.track(scope, 'DONE', finished);
    await finished;

    await expectAsync(pending.waitFor(scope, 'DONE')).toBeResolved();
    await expectAsync(pending.waitForAll()).toBeResolved();
  });

  it('forgets a failed occurrence without hiding its error', async () => {
    const failure = new Error('pending failure');
    const tracked = pending.track(scope, 'FAILED', Promise.reject(failure));

    await expectAsync(tracked).toBeRejectedWith(failure);
    await expectAsync(pending.waitFor(scope, 'FAILED')).toBeResolved();
  });

  it('reports completion, not success, to unrelated observers', async () => {
    const failing = gate();
    const tracked = pending.track(scope, 'FAILING', failing.promise);
    const waiting = pending.waitForScope(scope);

    failing.fail(new Error('unobserved failure'));

    await expectAsync(waiting).toBeResolved();
    await expectAsync(tracked).toBeRejected();
  });
});
