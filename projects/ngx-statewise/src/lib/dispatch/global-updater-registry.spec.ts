import type { StateBoundHandler } from '../updater/updater-definition';
import { GlobalUpdaterRegistry } from './global-updater-registry';

const handler: StateBoundHandler = {
  state: {},
  apply: (): void => undefined,
};

describe('GlobalUpdaterRegistry', () => {
  it('knows no handler until one is registered', () => {
    expect(new GlobalUpdaterRegistry().get('KNOWN')).toBeUndefined();
  });

  it('returns the handler registered for an action type', () => {
    const registry = new GlobalUpdaterRegistry();

    registry.set(new Map([['KNOWN', handler]]));

    expect(registry.get('KNOWN')).toBe(handler);
    expect(registry.get('UNKNOWN')).toBeUndefined();
  });

  it('replaces its content on a new registration', () => {
    const registry = new GlobalUpdaterRegistry();

    registry.set(new Map([['KNOWN', handler]]));
    registry.set(new Map());

    expect(registry.get('KNOWN')).toBeUndefined();
  });
});
