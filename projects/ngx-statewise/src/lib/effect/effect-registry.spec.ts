import { EffectRegistry } from './effect-registry';

const anAction = { type: 'SOURCE' } as const;

describe('EffectRegistry', () => {
  it('reports no effect for an unknown action type', () => {
    expect(new EffectRegistry().get('UNKNOWN')).toEqual([]);
  });

  it('keeps every effect registered for the same action type, in order', () => {
    const registry = new EffectRegistry();
    const first = (): typeof anAction => anAction;
    const second = (): undefined => undefined;

    registry.register('SOURCE', first);
    registry.register('SOURCE', second);

    expect(registry.get('SOURCE')).toEqual([first, second]);
  });

  it('never mutates a snapshot already handed out', () => {
    const registry = new EffectRegistry();
    const first = (): undefined => undefined;
    registry.register('SOURCE', first);

    const snapshot = registry.get('SOURCE');
    registry.register('SOURCE', () => undefined);

    expect(snapshot).toEqual([first]);
    expect(registry.get('SOURCE').length).toBe(2);
  });

  describe('unregister', () => {
    it('drops only the registration it is given', () => {
      const registry = new EffectRegistry();
      const kept = (): undefined => undefined;
      const dropped = (): undefined => undefined;
      registry.register('SOURCE', kept);
      registry.register('SOURCE', dropped);

      registry.unregister('SOURCE', dropped);

      expect(registry.get('SOURCE')).toEqual([kept]);
    });

    it('forgets the action type once its last effect is gone', () => {
      const registry = new EffectRegistry();
      const only = (): undefined => undefined;
      registry.register('SOURCE', only);

      registry.unregister('SOURCE', only);

      expect(registry.get('SOURCE')).toEqual([]);
    });

    it('ignores an effect that was never registered', () => {
      const registry = new EffectRegistry();
      const known = (): undefined => undefined;
      registry.register('SOURCE', known);

      registry.unregister('SOURCE', () => undefined);
      registry.unregister('UNKNOWN', known);

      expect(registry.get('SOURCE')).toEqual([known]);
    });
  });

  it('keeps action types independent from each other', () => {
    const registry = new EffectRegistry();
    const only = (): undefined => undefined;

    registry.register('SOURCE', only);

    expect(registry.get('OTHER')).toEqual([]);
  });
});
