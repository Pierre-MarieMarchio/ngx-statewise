import { ActionHistory, keepAction } from './action-history';
import { firstEntry } from '../../spec-helpers/first-entry';
import { historyEntry as entry } from '../../spec-helpers/history-entry';

describe('ActionHistory', () => {
  it('records nothing when its limit is zero', () => {
    const history = new ActionHistory(0, keepAction);

    history.record({ type: 'IGNORED' }, ['IGNORED']);

    expect(history.snapshot()).toEqual([]);
  });

  it('records the actions it receives, oldest first', () => {
    const history = new ActionHistory(5, keepAction);

    history.record({ type: 'FIRST' }, ['FIRST']);
    history.record({ type: 'SECOND', payload: 2 }, ['FIRST', 'SECOND']);

    expect(history.snapshot()).toEqual([
      entry({ type: 'FIRST' }, ['FIRST']),
      entry({ type: 'SECOND', payload: 2 }, ['FIRST', 'SECOND']),
    ]);
  });

  it('keeps only the latest actions up to its limit', () => {
    const history = new ActionHistory(2, keepAction);

    history.record({ type: 'FIRST' }, ['FIRST']);
    history.record({ type: 'SECOND' }, ['SECOND']);
    history.record({ type: 'THIRD' }, ['THIRD']);

    expect(history.snapshot()).toEqual([
      entry({ type: 'SECOND' }, ['SECOND']),
      entry({ type: 'THIRD' }, ['THIRD']),
    ]);
  });

  it('does not expose its mutable internal array', () => {
    const history = new ActionHistory(2, keepAction);
    history.record({ type: 'KEPT' }, ['KEPT']);

    const snapshot = history.snapshot() as unknown[];
    snapshot.length = 0;

    expect(history.snapshot()).toEqual([entry({ type: 'KEPT' }, ['KEPT'])]);
  });

  describe('what an entry is', () => {
    it('keeps an envelope of its own, not the action it was handed', () => {
      const history = new ActionHistory(2, keepAction);
      const dispatched = { type: 'RECORDED', payload: 1 };

      history.record(dispatched, ['RECORDED']);

      expect(firstEntry(history.snapshot()).action).not.toBe(dispatched);
    });

    it('freezes the entry, so a reader cannot rewrite the past', () => {
      const history = new ActionHistory(2, keepAction);
      history.record({ type: 'RECORDED', payload: 1 }, ['RECORDED']);

      const recorded = firstEntry(history.snapshot()) as unknown as {
        action: { type: string };
        cascade: string[];
      };

      expect(Object.isFrozen(recorded)).toBe(true);
      expect(() => {
        recorded.action.type = 'REWRITTEN';
      }).toThrow();
      expect(() => {
        recorded.cascade.push('APPENDED');
      }).toThrow();
      expect(history.snapshot()).toEqual([
        entry({ type: 'RECORDED', payload: 1 }, ['RECORDED']),
      ]);
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

      history.record({ type: 'RECORDED', payload }, ['RECORDED']);
      payload.items.push('second');

      expect(firstEntry(history.snapshot()).action.payload).toEqual({
        items: ['first', 'second'],
      });
    });
  });

  describe('what an entry knows beyond the action', () => {
    /**
     * The point of the whole change: a cascade used to be N entries no field
     * related. The paths now extend each other, so the sequence reads out.
     */
    it('keeps the cascade path that led to each action', () => {
      const history = new ActionHistory(5, keepAction);

      history.record({ type: 'SOURCE' }, ['SOURCE']);
      history.record({ type: 'CHILD' }, ['SOURCE', 'CHILD']);
      history.record({ type: 'GRANDCHILD' }, ['SOURCE', 'CHILD', 'GRANDCHILD']);

      expect(history.snapshot().map((recorded) => recorded.cascade)).toEqual([
        ['SOURCE'],
        ['SOURCE', 'CHILD'],
        ['SOURCE', 'CHILD', 'GRANDCHILD'],
      ]);
    });

    /**
     * What no other field provides: two concurrent dispatches of one action
     * type are otherwise indistinguishable, and ordering alone does not say
     * how far apart they were.
     */
    it('stamps the entry with the moment it was recorded', () => {
      const history = new ActionHistory(2, keepAction);
      const before = Date.now();

      history.record({ type: 'STAMPED' }, ['STAMPED']);

      const { recordedAt } = firstEntry(history.snapshot());

      expect(recordedAt).toBeGreaterThanOrEqual(before);
      expect(recordedAt).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('redaction', () => {
    it('records what the redaction answers instead of the action', () => {
      const history = new ActionHistory(2, (action) => ({
        type: action.type,
        payload: '[redacted]',
      }));

      history.record(
        { type: 'LOGIN_REQUEST', payload: { password: 'admin' } },
        ['LOGIN_REQUEST'],
      );

      expect(history.snapshot()).toEqual([
        entry({ type: 'LOGIN_REQUEST', payload: '[redacted]' }, [
          'LOGIN_REQUEST',
        ]),
      ]);
    });

    it('leaves the dispatched action untouched', () => {
      const dispatched = { type: 'LOGIN_REQUEST', payload: { password: 'a' } };
      const history = new ActionHistory(2, (action) => ({
        type: action.type,
      }));

      history.record(dispatched, ['LOGIN_REQUEST']);

      expect(dispatched.payload).toEqual({ password: 'a' });
    });

    it('is not consulted at all by a disabled history', () => {
      let consulted = 0;
      const history = new ActionHistory(0, (action) => {
        consulted += 1;

        return action;
      });

      history.record({ type: 'IGNORED' }, ['IGNORED']);

      expect(consulted).toBe(0);
    });
  });
});
