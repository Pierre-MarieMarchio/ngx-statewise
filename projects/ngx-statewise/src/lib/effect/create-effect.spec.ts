import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { defineActionsGroup, emptyPayload, payload } from '../action';
import { createEffect } from './create-effect';
import type { EffectContext } from './effect-context';
import { EffectRegistry } from './effect-registry';
import { firstEntry } from '../../spec-helpers/first-entry';

const actions = defineActionsGroup({
  source: 'created',
  events: {
    withPayload: payload<number>(),
    withoutPayload: emptyPayload,
    cancelled: emptyPayload,
    reset: emptyPayload,
  },
});

/** The context of a run the engine never abandons. */
const liveRun: EffectContext = {
  abortSignal: new AbortController().signal,
};

describe('createEffect', () => {
  let registry: EffectRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EffectRegistry] });
    registry = TestBed.inject(EffectRegistry);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('registers the effect under the action type of its creator', () => {
    TestBed.runInInjectionContext(() => {
      createEffect(actions.withoutPayload, () => undefined);
    });

    expect(registry.triggeredBy(actions.withoutPayload.type).length).toBe(1);
  });

  it('hands the action payload to the handler', () => {
    const received: number[] = [];
    TestBed.runInInjectionContext(() => {
      createEffect(actions.withPayload, (amount) => {
        received.push(amount);
      });
    });

    const effect = firstEntry(registry.triggeredBy(actions.withPayload.type));
    void effect.run(actions.withPayload(7), liveRun);

    expect(received).toEqual([7]);
  });

  it('hands the run context to the handler after the payload', () => {
    const received: EffectContext[] = [];
    TestBed.runInInjectionContext(() => {
      createEffect(actions.withPayload, (_amount, context) => {
        received.push(context);
      });
    });

    const effect = firstEntry(registry.triggeredBy(actions.withPayload.type));
    void effect.run(actions.withPayload(7), liveRun);

    expect(received).toEqual([liveRun]);
  });

  /**
   * An action carrying nothing still has that first parameter, `undefined`, so
   * that one call shape covers every effect.
   */
  it('hands the run context second to a handler with no payload', () => {
    const received: EffectContext[] = [];
    TestBed.runInInjectionContext(() => {
      createEffect(actions.withoutPayload, (_none, context) => {
        received.push(context);
      });
    });

    const effect = firstEntry(
      registry.triggeredBy(actions.withoutPayload.type),
    );
    void effect.run(actions.withoutPayload(), liveRun);

    expect(received).toEqual([liveRun]);
  });

  it('returns the handler result to the engine untouched', () => {
    const produced = actions.withoutPayload();
    TestBed.runInInjectionContext(() => {
      createEffect(actions.withPayload, () => produced);
    });

    const effect = firstEntry(registry.triggeredBy(actions.withPayload.type));

    expect(effect.run(actions.withPayload(1), liveRun)).toBe(produced);
  });

  it('keeps several effects on the same action', () => {
    TestBed.runInInjectionContext(() => {
      createEffect(actions.withoutPayload, () => undefined);
      createEffect(actions.withoutPayload, () => undefined);
    });

    expect(registry.triggeredBy(actions.withoutPayload.type).length).toBe(2);
  });

  describe('options', () => {
    it('runs everything in parallel and cancels on nothing by default', () => {
      TestBed.runInInjectionContext(() => {
        createEffect(actions.withPayload, () => undefined);
      });

      const effect = firstEntry(registry.triggeredBy(actions.withPayload.type));

      expect(effect.concurrency).toBe('parallel');
      expect(effect.cancelledBy).toEqual([]);
      expect(effect.mustAnswer).toBe(false);
    });

    it('carries the promise to always answer with an action', () => {
      TestBed.runInInjectionContext(() => {
        createEffect(actions.withPayload, () => undefined, {
          mustAnswer: true,
        });
      });

      const effect = firstEntry(registry.triggeredBy(actions.withPayload.type));

      expect(effect.mustAnswer).toBe(true);
    });

    it('carries the declared concurrency policy', () => {
      TestBed.runInInjectionContext(() => {
        createEffect(actions.withPayload, () => undefined, {
          concurrency: 'latest',
        });
      });

      const effect = firstEntry(registry.triggeredBy(actions.withPayload.type));

      expect(effect.concurrency).toBe('latest');
    });

    it('puts every run of a keyless effect in one group', () => {
      TestBed.runInInjectionContext(() => {
        createEffect(actions.withPayload, () => undefined);
      });

      const effect = firstEntry(registry.triggeredBy(actions.withPayload.type));

      expect(effect.keyOf(actions.withPayload(1))).toBe(
        effect.keyOf(actions.withPayload(2)),
      );
    });

    it('derives the concurrency group from the payload', () => {
      TestBed.runInInjectionContext(() => {
        createEffect(actions.withPayload, () => undefined, {
          key: (amount) => `task-${String(amount)}`,
        });
      });

      const effect = firstEntry(registry.triggeredBy(actions.withPayload.type));

      expect(effect.keyOf(actions.withPayload(7))).toBe('task-7');
    });

    it('accepts one cancelling action or several', () => {
      TestBed.runInInjectionContext(() => {
        createEffect(actions.withPayload, () => undefined, {
          cancelOn: actions.cancelled,
        });
        createEffect(actions.withoutPayload, () => undefined, {
          cancelOn: [actions.cancelled, actions.reset],
        });
      });

      const single = firstEntry(registry.triggeredBy(actions.withPayload.type));
      const several = firstEntry(
        registry.triggeredBy(actions.withoutPayload.type),
      );

      expect(single.cancelledBy).toEqual([actions.cancelled.type]);
      expect(several.cancelledBy).toEqual([
        actions.cancelled.type,
        actions.reset.type,
      ]);
    });

    it('indexes the effect under the action types cancelling it', () => {
      TestBed.runInInjectionContext(() => {
        createEffect(actions.withPayload, () => undefined, {
          cancelOn: actions.cancelled,
        });
      });

      expect(registry.cancelledBy(actions.cancelled.type).length).toBe(1);
    });
  });

  describe('lifecycle', () => {
    it('unregisters the effect when its injector is destroyed', () => {
      const child = createEnvironmentInjector(
        [],
        TestBed.inject(EnvironmentInjector),
      );
      runInInjectionContext(child, () => {
        createEffect(actions.withoutPayload, () => undefined);
      });

      expect(registry.triggeredBy(actions.withoutPayload.type).length).toBe(1);

      child.destroy();

      expect(registry.triggeredBy(actions.withoutPayload.type).length).toBe(0);
    });

    it('unregisters its cancelling entries along with it', () => {
      const child = createEnvironmentInjector(
        [],
        TestBed.inject(EnvironmentInjector),
      );
      runInInjectionContext(child, () => {
        createEffect(actions.withPayload, () => undefined, {
          cancelOn: actions.cancelled,
        });
      });

      child.destroy();

      expect(registry.cancelledBy(actions.cancelled.type).length).toBe(0);
    });

    it('does not duplicate an effect across instantiations of one class', () => {
      const first = createEnvironmentInjector(
        [],
        TestBed.inject(EnvironmentInjector),
      );
      const second = createEnvironmentInjector(
        [],
        TestBed.inject(EnvironmentInjector),
      );
      runInInjectionContext(first, () => {
        createEffect(actions.withoutPayload, () => undefined);
      });
      runInInjectionContext(second, () => {
        createEffect(actions.withoutPayload, () => undefined);
      });

      expect(registry.triggeredBy(actions.withoutPayload.type).length).toBe(2);

      first.destroy();
      second.destroy();

      expect(registry.triggeredBy(actions.withoutPayload.type).length).toBe(0);
    });
  });

  /**
   * Named in the message on purpose: `inject` would refuse here too, but its
   * error blames `inject()`, which says nothing about what the caller wrote.
   * Matching only on "injection context" passed with the assertion removed.
   */
  it('refuses to register outside an injection context', () => {
    expect(() => {
      createEffect(actions.withoutPayload, () => undefined);
    }).toThrow(/createEffect\(\).*injection context/is);
  });
});
