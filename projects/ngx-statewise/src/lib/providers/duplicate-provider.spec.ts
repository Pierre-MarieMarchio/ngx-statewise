import {
  defaultDuplicateProviderReaction,
  duplicateProviderError,
} from './duplicate-provider';

describe('duplicate provider', () => {
  describe('defaultDuplicateProviderReaction', () => {
    it('throws in development, where a mistake must not be missed', () => {
      expect(defaultDuplicateProviderReaction(true)).toBe('throw');
    });

    /**
     * A `TestBed` always runs in development mode, so this arm is only
     * reachable by calling the function — which is why it takes the flag
     * instead of reading it.
     */
    it('reports in production, where taking the app down would be worse', () => {
      expect(defaultDuplicateProviderReaction(false)).toBe('report');
    });
  });

  describe('duplicateProviderError', () => {
    it('names the cause, the symptom and the way out', () => {
      const message = duplicateProviderError().message;

      expect(message).toContain(
        'provideStatewise() has already been called by a parent injector',
      );
      // The symptom is what makes this trap quiet, so it is named too: the
      // state moves, and the action looks like it worked.
      expect(message).toContain('their effects never run');
      expect(message).toContain('createEffect()');
    });
  });
});
