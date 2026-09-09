import {
  createEnvironmentInjector,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { defineActionsGroup, emptyPayload, payload } from '../action';
import { createInterceptor } from './create-interceptor';
import { InterceptorRegistry } from './interceptor-registry';

const actions = defineActionsGroup({
  source: 'guarded',
  events: {
    withPayload: payload<number>(),
    withoutPayload: emptyPayload,
  },
});

describe('createInterceptor', () => {
  let registry: InterceptorRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [InterceptorRegistry] });
    registry = TestBed.inject(InterceptorRegistry);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('registers the interceptor under the action type of its creator', () => {
    TestBed.runInInjectionContext(() => {
      createInterceptor(actions.withoutPayload, () => undefined);
    });

    expect(registry.guarding(actions.withoutPayload.type).length).toBe(1);
  });

  it('hands the action payload to the handler', () => {
    const received: number[] = [];
    TestBed.runInInjectionContext(() => {
      createInterceptor(actions.withPayload, (amount) => {
        received.push(amount);
      });
    });

    const [interceptor] = registry.guarding(actions.withPayload.type);
    interceptor.ask(actions.withPayload(7));

    expect(received).toEqual([7]);
  });

  it('returns the verdict of the handler untouched', () => {
    TestBed.runInInjectionContext(() => {
      createInterceptor(actions.withPayload, (amount) => amount > 0);
    });

    const [interceptor] = registry.guarding(actions.withPayload.type);

    expect(interceptor.ask(actions.withPayload(1))).toBe(true);
    expect(interceptor.ask(actions.withPayload(-1))).toBe(false);
  });

  it('keeps several interceptors on the same action', () => {
    TestBed.runInInjectionContext(() => {
      createInterceptor(actions.withoutPayload, () => undefined);
      createInterceptor(actions.withoutPayload, () => undefined);
    });

    expect(registry.guarding(actions.withoutPayload.type).length).toBe(2);
  });

  describe('lifecycle', () => {
    it('unregisters the interceptor when its injector is destroyed', () => {
      const child = createEnvironmentInjector(
        [],
        TestBed.inject(EnvironmentInjector),
      );
      runInInjectionContext(child, () => {
        createInterceptor(actions.withoutPayload, () => undefined);
      });

      expect(registry.guarding(actions.withoutPayload.type).length).toBe(1);

      child.destroy();

      expect(registry.guarding(actions.withoutPayload.type).length).toBe(0);
    });

    it('unregisters early through the handle it returns', () => {
      const ref = TestBed.runInInjectionContext(() =>
        createInterceptor(actions.withoutPayload, () => undefined),
      );

      ref.destroy();

      expect(registry.guarding(actions.withoutPayload.type).length).toBe(0);
    });

    /**
     * Two interceptors sharing one handler function are still two
     * registrations, so destroying one must not take the other with it.
     */
    it('does not duplicate an interceptor across instantiations of one class', () => {
      const handler = (): void => undefined;
      const first = createEnvironmentInjector(
        [],
        TestBed.inject(EnvironmentInjector),
      );
      const second = createEnvironmentInjector(
        [],
        TestBed.inject(EnvironmentInjector),
      );
      runInInjectionContext(first, () => {
        createInterceptor(actions.withoutPayload, handler);
      });
      runInInjectionContext(second, () => {
        createInterceptor(actions.withoutPayload, handler);
      });

      expect(registry.guarding(actions.withoutPayload.type).length).toBe(2);

      first.destroy();

      expect(registry.guarding(actions.withoutPayload.type).length).toBe(1);

      second.destroy();

      expect(registry.guarding(actions.withoutPayload.type).length).toBe(0);
    });
  });

  /**
   * Named in the message on purpose: `inject` would refuse here too, but its
   * error blames `inject()`, which says nothing about what the caller wrote.
   */
  it('refuses to register outside an injection context', () => {
    expect(() => {
      createInterceptor(actions.withoutPayload, () => undefined);
    }).toThrow(/createInterceptor\(\).*injection context/is);
  });
});
