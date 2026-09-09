import { ActionHistory, keepAction } from './action-history';

describe('ActionHistory', () => {
  it('records nothing when its limit is zero', () => {
    const history = new ActionHistory(0, keepAction);

    history.record({ type: 'IGNORED' });

    expect(history.snapshot()).toEqual([]);
  });

  it('records the actions it receives, oldest first', () => {
    const history = new ActionHistory(5, keepAction);

    history.record({ type: 'FIRST' });
    history.record({ type: 'SECOND', payload: 2 });

    expect(history.snapshot()).toEqual([
      { type: 'FIRST' },
      { type: 'SECOND', payload: 2 },
    ]);
  });

  it('keeps only the latest actions up to its limit', () => {
    const history = new ActionHistory(2, keepAction);

    history.record({ type: 'FIRST' });
    history.record({ type: 'SECOND' });
    history.record({ type: 'THIRD' });

    expect(history.snapshot()).toEqual([{ type: 'SECOND' }, { type: 'THIRD' }]);
  });

  it('does not expose its mutable internal array', () => {
    const history = new ActionHistory(2, keepAction);
    history.record({ type: 'KEPT' });

    const snapshot = history.snapshot() as { type: string }[];
    snapshot.length = 0;

    expect(history.snapshot()).toEqual([{ type: 'KEPT' }]);
  });

  describe('what an entry is', () => {
    it('keeps an envelope of its own, not the action it was handed', () => {
      const history = new ActionHistory(2, keepAction);
      const dispatched = { type: 'RECORDED', payload: 1 };

      history.record(dispatched);

      expect(history.snapshot()[0]).not.toBe(dispatched);
    });

    it('freezes the entry, so a reader cannot rewrite the past', () => {
      const history = new ActionHistory(2, keepAction);
      history.record({ type: 'RECORDED', payload: 1 });

      const [entry] = history.snapshot() as { type: string }[];

      expect(Object.isFrozen(entry)).toBe(true);
      expect(() => {
        entry.type = 'REWRITTEN';
      }).toThrow();
      expect(history.snapshot()).toEqual([{ type: 'RECORDED', payload: 1 }]);
    });

    /**
     * Stated rather than fixed: copying a payload would require knowing how,
     * and a `Date`, a `Map` or a class instance does not survive a naive
     * clone. An application that mutates a payload changes what the history
     * shows of the past, which is why the guide says not to.
     */
    it('keeps the payload by reference', () => {
      const history = new ActionHistory(2, keepAction);
      const payload = { items: ['first'] };

      history.record({ type: 'RECORDED', payload });
      payload.items.push('second');

      expect(history.snapshot()[0].payload).toEqual({
        items: ['first', 'second'],
      });
    });
  });

  describe('redaction', () => {
    it('records what the redaction answers instead of the action', () => {
      const history = new ActionHistory(2, (action) => ({
        type: action.type,
        payload: '[redacted]',
      }));

      history.record({ type: 'LOGIN_REQUEST', payload: { password: 'admin' } });

      expect(history.snapshot()).toEqual([
        { type: 'LOGIN_REQUEST', payload: '[redacted]' },
      ]);
    });

    it('leaves the dispatched action untouched', () => {
      const dispatched = { type: 'LOGIN_REQUEST', payload: { password: 'a' } };
      const history = new ActionHistory(2, (action) => ({
        type: action.type,
      }));

      history.record(dispatched);

      expect(dispatched.payload).toEqual({ password: 'a' });
    });

    it('is not consulted at all by a disabled history', () => {
      let consulted = 0;
      const history = new ActionHistory(0, (action) => {
        consulted += 1;

        return action;
      });

      history.record({ type: 'IGNORED' });

      expect(consulted).toBe(0);
    });
  });
});
