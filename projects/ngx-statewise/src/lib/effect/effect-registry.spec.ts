import { registeredEffect } from '../../spec-helpers/registered-effect';
import { EffectRegistry } from './effect-registry';

const anAction = { type: 'SOURCE' } as const;

describe('EffectRegistry', () => {
  it('reports no effect for an unknown action type', () => {
    expect(new EffectRegistry().triggeredBy('UNKNOWN')).toEqual([]);
    expect(new EffectRegistry().cancelledBy('UNKNOWN')).toEqual([]);
  });

  it('keeps every effect registered for the same action type, in order', () => {
    const registry = new EffectRegistry();
    const first = registeredEffect(() => anAction);
    const second = registeredEffect(() => undefined);

    registry.register('SOURCE', first);
    registry.register('SOURCE', second);

    expect(registry.triggeredBy('SOURCE')).toEqual([first, second]);
  });

  it('never mutates a snapshot already handed out', () => {
    const registry = new EffectRegistry();
    const first = registeredEffect(() => undefined);
    registry.register('SOURCE', first);

    const snapshot = registry.triggeredBy('SOURCE');
    registry.register(
      'SOURCE',
      registeredEffect(() => undefined),
    );

    expect(snapshot).toEqual([first]);
    expect(registry.triggeredBy('SOURCE').length).toBe(2);
  });

  describe('unregister', () => {
    it('drops only the registration it is given', () => {
      const registry = new EffectRegistry();
      const kept = registeredEffect(() => undefined);
      const dropped = registeredEffect(() => undefined);
      registry.register('SOURCE', kept);
      registry.register('SOURCE', dropped);

      registry.unregister('SOURCE', dropped);

      expect(registry.triggeredBy('SOURCE')).toEqual([kept]);
    });

    it('forgets the action type once its last effect is gone', () => {
      const registry = new EffectRegistry();
      const only = registeredEffect(() => undefined);
      registry.register('SOURCE', only);

      registry.unregister('SOURCE', only);

      expect(registry.triggeredBy('SOURCE')).toEqual([]);
    });

    it('ignores an effect that was never registered', () => {
      const registry = new EffectRegistry();
      const known = registeredEffect(() => undefined);
      registry.register('SOURCE', known);

      registry.unregister(
        'SOURCE',
        registeredEffect(() => undefined),
      );
      registry.unregister('UNKNOWN', known);

      expect(registry.triggeredBy('SOURCE')).toEqual([known]);
    });
  });

  it('keeps action types independent from each other', () => {
    const registry = new EffectRegistry();
    const only = registeredEffect(() => undefined);

    registry.register('SOURCE', only);

    expect(registry.triggeredBy('OTHER')).toEqual([]);
  });

  describe('cancelling action types', () => {
    it('indexes an effect under every action type cancelling it', () => {
      const registry = new EffectRegistry();
      const cancellable = registeredEffect(() => undefined, {
        cancelledBy: ['ABORTED', 'RESET'],
      });

      registry.register('SOURCE', cancellable);

      expect(registry.cancelledBy('ABORTED')).toEqual([cancellable]);
      expect(registry.cancelledBy('RESET')).toEqual([cancellable]);
    });

    /** The two indexes answer different questions about the same effect. */
    it('keeps the triggering type out of the cancelling index', () => {
      const registry = new EffectRegistry();
      const cancellable = registeredEffect(() => undefined, {
        cancelledBy: ['ABORTED'],
      });

      registry.register('SOURCE', cancellable);

      expect(registry.cancelledBy('SOURCE')).toEqual([]);
      expect(registry.triggeredBy('ABORTED')).toEqual([]);
    });

    it('drops every cancelling entry when the effect is unregistered', () => {
      const registry = new EffectRegistry();
      const cancellable = registeredEffect(() => undefined, {
        cancelledBy: ['ABORTED', 'RESET'],
      });
      registry.register('SOURCE', cancellable);

      registry.unregister('SOURCE', cancellable);

      expect(registry.cancelledBy('ABORTED')).toEqual([]);
      expect(registry.cancelledBy('RESET')).toEqual([]);
    });

    it('lets one cancelling type reach several effects', () => {
      const registry = new EffectRegistry();
      const first = registeredEffect(() => undefined, {
        cancelledBy: ['ABORTED'],
      });
      const second = registeredEffect(() => undefined, {
        cancelledBy: ['ABORTED'],
      });

      registry.register('FIRST_SOURCE', first);
      registry.register('SECOND_SOURCE', second);

      expect(registry.cancelledBy('ABORTED')).toEqual([first, second]);
    });
  });
});
