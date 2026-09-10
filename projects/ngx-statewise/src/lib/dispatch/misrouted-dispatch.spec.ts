import {
  defaultMisroutedDispatchReaction,
  misroutedActionError,
} from './misrouted-dispatch';

describe('misrouted dispatch', () => {
  describe('defaultMisroutedDispatchReaction', () => {
    it('throws in development, where a mistake must not be missed', () => {
      expect(defaultMisroutedDispatchReaction(true)).toBe('throw');
    });

    it('reports in production, where taking the app down would be worse', () => {
      expect(defaultMisroutedDispatchReaction(false)).toBe('report');
    });
  });

  describe('misroutedActionError', () => {
    it('names the action type and both ways out', () => {
      const message = misroutedActionError('MY_ACTION').message;

      expect(message).toContain('No updater in scope for "MY_ACTION"');
      expect(message).toContain('injectStatewise()');
      expect(message).toContain('provideStatewise({ updaters: [...] })');
    });
  });
});
