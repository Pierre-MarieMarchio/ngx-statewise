import { ActionHistory } from './action-history';

describe('ActionHistory', () => {
  it('records nothing when its limit is zero', () => {
    const history = new ActionHistory(0);

    history.record({ type: 'IGNORED' });

    expect(history.snapshot()).toEqual([]);
  });

  it('records the actions it receives, oldest first', () => {
    const history = new ActionHistory(5);

    history.record({ type: 'FIRST' });
    history.record({ type: 'SECOND', payload: 2 });

    expect(history.snapshot()).toEqual([
      { type: 'FIRST' },
      { type: 'SECOND', payload: 2 },
    ]);
  });

  it('keeps only the latest actions up to its limit', () => {
    const history = new ActionHistory(2);

    history.record({ type: 'FIRST' });
    history.record({ type: 'SECOND' });
    history.record({ type: 'THIRD' });

    expect(history.snapshot()).toEqual([{ type: 'SECOND' }, { type: 'THIRD' }]);
  });

  it('does not expose its mutable internal array', () => {
    const history = new ActionHistory(2);
    history.record({ type: 'KEPT' });

    const snapshot = history.snapshot() as { type: string }[];
    snapshot.length = 0;

    expect(history.snapshot()).toEqual([{ type: 'KEPT' }]);
  });
});
