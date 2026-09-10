import { registeredEffect } from '../../spec-helpers/registered-effect';
import type { EffectConcurrency } from './effect-concurrency';
import type { RegisteredEffect } from './registered-effect';
import { RunningEffects } from './running-effects';

function effectWith(
  concurrency: EffectConcurrency,
  cancelledBy: readonly string[] = [],
): RegisteredEffect {
  return registeredEffect(() => undefined, { concurrency, cancelledBy });
}

/**
 * The groups this effect holds in this scope, read from inside the instance.
 *
 * A retention invariant has no observable surface, since every behaviour is
 * the same whether or not an empty group is dropped, so the only assertion that
 * can hold it is one that knows the shape of the class it tests.
 */
function groupsOf(
  running: RunningEffects,
  effect: RegisteredEffect,
  scope: object,
): ReadonlyMap<string, unknown> | undefined {
  const internals = running as unknown as {
    readonly groups: WeakMap<
      RegisteredEffect,
      WeakMap<object, Map<string, unknown>>
    >;
  };

  return internals.groups.get(effect)?.get(scope);
}

describe('RunningEffects', () => {
  const scope = {};
  const otherScope = {};
  let running: RunningEffects;

  beforeEach(() => {
    running = new RunningEffects();
  });

  describe("'parallel'", () => {
    it('opens every run and abandons none', () => {
      const effect = effectWith('parallel');

      const first = running.start(effect, scope, '');
      const second = running.start(effect, scope, '');

      expect(first?.abortSignal.aborted).toBe(false);
      expect(second?.abortSignal.aborted).toBe(false);
    });

    /**
     * An effect nothing competes with and nothing cancels stays out of the
     * bookkeeping, so the path that existed before this policy did keeps
     * costing nothing.
     */
    it('leaves an uncancellable effect untracked', () => {
      const effect = effectWith('parallel');
      const run = running.start(effect, scope, '');

      running.cancel(effect, scope);

      expect(run?.abortSignal.aborted).toBe(false);
    });

    it('tracks it as soon as an action can cancel it', () => {
      const effect = effectWith('parallel', ['ABORTED']);
      const first = running.start(effect, scope, '');
      const second = running.start(effect, scope, '');

      running.cancel(effect, scope);

      expect(first?.abortSignal.aborted).toBe(true);
      expect(second?.abortSignal.aborted).toBe(true);
    });
  });

  describe("'latest'", () => {
    it('abandons the run in flight and opens the new one', () => {
      const effect = effectWith('latest');

      const superseded = running.start(effect, scope, '');
      const current = running.start(effect, scope, '');

      expect(superseded?.abortSignal.aborted).toBe(true);
      expect(current?.abortSignal.aborted).toBe(false);
    });

    it('opens a run again once the previous one has finished', () => {
      const effect = effectWith('latest');
      const first = running.start(effect, scope, '');
      first?.finish();

      const second = running.start(effect, scope, '');

      expect(first?.abortSignal.aborted).toBe(false);
      expect(second?.abortSignal.aborted).toBe(false);
    });

    /**
     * A superseded run finishes on its own, later, and must not release the
     * group its successor now holds.
     */
    it('keeps a superseded run from releasing its successor', () => {
      const effect = effectWith('latest');
      const superseded = running.start(effect, scope, '');
      const current = running.start(effect, scope, '');

      superseded?.finish();
      const third = running.start(effect, scope, '');

      expect(current?.abortSignal.aborted).toBe(true);
      expect(third?.abortSignal.aborted).toBe(false);
    });
  });

  describe("'first'", () => {
    it('opens nothing while a run is in flight', () => {
      const effect = effectWith('first');

      const held = running.start(effect, scope, '');

      expect(running.start(effect, scope, '')).toBeUndefined();
      expect(held?.abortSignal.aborted).toBe(false);
    });

    it('opens a run again once the one in flight has finished', () => {
      const effect = effectWith('first');
      const held = running.start(effect, scope, '');
      held?.finish();

      expect(running.start(effect, scope, '')).toBeDefined();
    });
  });

  describe('what competes with what', () => {
    it('keeps two concurrency keys independent', () => {
      const effect = effectWith('latest');

      const one = running.start(effect, scope, 'task-1');
      const two = running.start(effect, scope, 'task-2');

      expect(one?.abortSignal.aborted).toBe(false);
      expect(two?.abortSignal.aborted).toBe(false);
    });

    it('keeps two dispatch scopes independent', () => {
      const effect = effectWith('latest');

      const mine = running.start(effect, scope, '');
      const theirs = running.start(effect, otherScope, '');

      expect(mine?.abortSignal.aborted).toBe(false);
      expect(theirs?.abortSignal.aborted).toBe(false);
    });

    it('keeps two effects independent, same policy and same key', () => {
      const first = effectWith('latest');
      const second = effectWith('latest');

      const one = running.start(first, scope, '');
      const two = running.start(second, scope, '');

      expect(one?.abortSignal.aborted).toBe(false);
      expect(two?.abortSignal.aborted).toBe(false);
    });
  });

  /**
   * What the purge buys, and what no behavioural assertion can see: an effect
   * keyed by entity must not keep one empty group per entity it has ever seen.
   * Two keys are used because one would leave the group of the single key
   * indistinguishable from the absence of any group at all.
   */
  it('drops the group of a key once its last run is over', () => {
    const effect = effectWith('latest');
    const one = running.start(effect, scope, 'task-1');
    const two = running.start(effect, scope, 'task-2');

    one?.finish();
    two?.finish();

    expect(groupsOf(running, effect, scope)?.size).toBe(0);
  });

  describe('cancel', () => {
    it('abandons every key of the effect at once', () => {
      const effect = effectWith('parallel', ['ABORTED']);
      const one = running.start(effect, scope, 'task-1');
      const two = running.start(effect, scope, 'task-2');

      running.cancel(effect, scope);

      expect(one?.abortSignal.aborted).toBe(true);
      expect(two?.abortSignal.aborted).toBe(true);
    });

    it('abandons only the runs of the scope it is given', () => {
      const effect = effectWith('latest', ['ABORTED']);
      const mine = running.start(effect, scope, '');
      const theirs = running.start(effect, otherScope, '');

      running.cancel(effect, scope);

      expect(mine?.abortSignal.aborted).toBe(true);
      expect(theirs?.abortSignal.aborted).toBe(false);
    });

    it('abandons only the effect it is given', () => {
      const cancelled = effectWith('latest', ['ABORTED']);
      const untouched = effectWith('latest', ['ABORTED']);
      const one = running.start(cancelled, scope, '');
      const two = running.start(untouched, scope, '');

      running.cancel(cancelled, scope);

      expect(one?.abortSignal.aborted).toBe(true);
      expect(two?.abortSignal.aborted).toBe(false);
    });

    it('lets a new run open right after a cancellation', () => {
      const effect = effectWith('first', ['ABORTED']);
      running.start(effect, scope, '');

      running.cancel(effect, scope);

      expect(running.start(effect, scope, '')).toBeDefined();
    });

    it('says nothing of an effect that has never run', () => {
      expect(() => {
        running.cancel(effectWith('latest', ['ABORTED']), scope);
      }).not.toThrow();
    });
  });
});
