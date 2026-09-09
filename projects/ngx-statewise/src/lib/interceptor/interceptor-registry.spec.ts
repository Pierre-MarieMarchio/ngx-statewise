import { InterceptorRegistry } from './interceptor-registry';
import type { RegisteredInterceptor } from './registered-interceptor';

function interceptor(verdict?: boolean): RegisteredInterceptor {
  return { ask: () => verdict };
}

describe('InterceptorRegistry', () => {
  let registry: InterceptorRegistry;

  beforeEach(() => {
    registry = new InterceptorRegistry();
  });

  it('answers nothing for an action type nobody guards', () => {
    expect(registry.guarding('UNGUARDED')).toEqual([]);
  });

  it('keeps the registration order, which is the order they are asked in', () => {
    const first = interceptor();
    const second = interceptor();
    registry.register('GUARDED', first);
    registry.register('GUARDED', second);

    expect(registry.guarding('GUARDED')).toEqual([first, second]);
  });

  it('drops one registration and keeps the others', () => {
    const kept = interceptor();
    const dropped = interceptor();
    registry.register('GUARDED', kept);
    registry.register('GUARDED', dropped);

    registry.unregister('GUARDED', dropped);

    expect(registry.guarding('GUARDED')).toEqual([kept]);
  });

  it('answers nothing once its last interceptor is gone', () => {
    const only = interceptor();
    registry.register('GUARDED', only);

    registry.unregister('GUARDED', only);

    expect(registry.guarding('GUARDED')).toEqual([]);
  });

  it('ignores an interceptor it never held', () => {
    const held = interceptor();
    registry.register('GUARDED', held);

    registry.unregister('GUARDED', interceptor());
    registry.unregister('UNGUARDED', held);

    expect(registry.guarding('GUARDED')).toEqual([held]);
  });
});
