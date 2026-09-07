import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { defineActionsGroup, emptyPayload, payload } from '../action';
import { createEffect } from './create-effect';
import { EffectRegistry } from './effect-registry';

const actions = defineActionsGroup({
  source: 'created',
  events: {
    withPayload: payload<number>(),
    withoutPayload: emptyPayload,
  },
});

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

    expect(registry.get(actions.withoutPayload.type).length).toBe(1);
  });

  it('hands the action payload to the handler', () => {
    const received: number[] = [];
    TestBed.runInInjectionContext(() => {
      createEffect(actions.withPayload, (amount) => {
        received.push(amount);
      });
    });

    const [effect] = registry.get(actions.withPayload.type);
    void effect(actions.withPayload(7));

    expect(received).toEqual([7]);
  });

  it('returns the handler result to the engine untouched', () => {
    const produced = actions.withoutPayload();
    TestBed.runInInjectionContext(() => {
      createEffect(actions.withPayload, () => produced);
    });

    const [effect] = registry.get(actions.withPayload.type);

    expect(effect(actions.withPayload(1))).toBe(produced);
  });

  it('keeps several effects on the same action', () => {
    TestBed.runInInjectionContext(() => {
      createEffect(actions.withoutPayload, () => undefined);
      createEffect(actions.withoutPayload, () => undefined);
    });

    expect(registry.get(actions.withoutPayload.type).length).toBe(2);
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

      expect(registry.get(actions.withoutPayload.type).length).toBe(1);

      child.destroy();

      expect(registry.get(actions.withoutPayload.type).length).toBe(0);
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

      expect(registry.get(actions.withoutPayload.type).length).toBe(2);

      first.destroy();
      second.destroy();

      expect(registry.get(actions.withoutPayload.type).length).toBe(0);
    });
  });

  it('refuses to register outside an injection context', () => {
    expect(() => {
      createEffect(actions.withoutPayload, () => undefined);
    }).toThrowError(/injection context/i);
  });
});
