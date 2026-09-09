import { Injectable, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import {
  createEffect,
  defineActionsGroup,
  defineUpdater,
  emptyPayload,
  injectStatewise,
  payload,
  provideStatewise,
  type Statewise,
} from '../public-api';

interface Gate {
  readonly promise: Promise<void>;
  readonly open: () => void;
  readonly fail: (reason: Error) => void;
}

function gate(): Gate {
  let open!: () => void;
  let fail!: (reason: Error) => void;
  const promise = new Promise<void>((resolve, reject) => {
    open = () => {
      resolve();
    };
    fail = reject;
  });

  return { promise, open, fail };
}

/**
 * What the runs record about themselves. `applied` is written by an updater, so
 * it holds what actually reached the state; `started` and `abandoned` are
 * written by the handlers.
 */
interface Journal {
  applied: string[];
  started: string[];
  abandoned: string[];
}

const JOURNAL = new InjectionToken<Journal>('JOURNAL');
const OTHER_JOURNAL = new InjectionToken<Journal>('OTHER_JOURNAL');

/** One write per entity, the shape the report's kanban case has. */
const writeActions = defineActionsGroup({
  source: 'Write',
  events: {
    request: payload<{ entity: string; value: string }>(),
    success: payload<string>(),
    cancel: emptyPayload,
  },
});

/** One submission at a time, the shape the report's login case has. */
const submitActions = defineActionsGroup({
  source: 'Submit',
  events: {
    request: payload<string>(),
    success: payload<string>(),
  },
});

/** A one-shot source, to watch the subscription rather than the answer. */
const streamActions = defineActionsGroup({
  source: 'Stream',
  events: {
    request: payload<string>(),
    success: payload<string>(),
  },
});

let gates: Map<string, Gate>;
let sources: Map<string, Subject<ReturnType<typeof streamActions.success>>>;
let journal: Journal;

function gateFor(value: string): Gate {
  const existing = gates.get(value);

  if (existing !== undefined) {
    return existing;
  }

  const created = gate();
  gates.set(value, created);

  return created;
}

function sourceFor(
  value: string,
): Subject<ReturnType<typeof streamActions.success>> {
  const existing = sources.get(value);

  if (existing !== undefined) {
    return existing;
  }

  const created = new Subject<ReturnType<typeof streamActions.success>>();
  sources.set(value, created);

  return created;
}

/** Resolves once the handler for that value has started. */
function started(value: string): Promise<void> {
  return waitUntil(() => journal.started.includes(value));
}

async function waitUntil(reached: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 100 && !reached(); attempt += 1) {
    await Promise.resolve();
  }
}

@Injectable()
class ConcurrentEffects {
  /**
   * Superseded per entity: a second write to the same entity abandons the
   * first, while two entities never compete.
   */
  private readonly write = createEffect(
    writeActions.request,
    async ({ value }, { abortSignal }) => {
      journal.started.push(value);
      await gateFor(value).promise;

      if (abortSignal.aborted) {
        journal.abandoned.push(value);
      }

      return writeActions.success(value);
    },
    {
      concurrency: 'latest',
      key: ({ entity }) => entity,
      cancelOn: writeActions.cancel,
    },
  );

  /** One submission at a time: a double click starts no second run. */
  private readonly submit = createEffect(
    submitActions.request,
    async (value) => {
      journal.started.push(value);
      await gateFor(value).promise;

      return submitActions.success(value);
    },
    { concurrency: 'first' },
  );

  /** Answers through a source, so the subscription itself can be observed. */
  private readonly stream = createEffect(
    streamActions.request,
    (value) => {
      journal.started.push(value);

      return sourceFor(value);
    },
    { concurrency: 'latest' },
  );
}

function journalUpdater(token: InjectionToken<Journal>) {
  return defineUpdater(token, (on) => {
    on(writeActions.request, () => undefined);
    on(writeActions.success, (state, value) => {
      state.applied.push(value);
    });
    on(submitActions.request, () => undefined);
    on(submitActions.success, (state, value) => {
      state.applied.push(value);
    });
    on(streamActions.request, () => undefined);
    on(streamActions.success, (state, value) => {
      state.applied.push(value);
    });
  });
}

const ownUpdater = journalUpdater(JOURNAL);
const otherUpdater = journalUpdater(OTHER_JOURNAL);

describe('effect concurrency contract', () => {
  let otherJournal: Journal;
  let manager: Statewise;

  function managerOf(
    ...updaters: Parameters<typeof injectStatewise>
  ): Statewise {
    return TestBed.runInInjectionContext(() => injectStatewise(...updaters));
  }

  beforeEach(() => {
    gates = new Map();
    sources = new Map();
    journal = { applied: [], started: [], abandoned: [] };
    otherJournal = { applied: [], started: [], abandoned: [] };

    TestBed.configureTestingModule({
      providers: [
        provideStatewise({ effects: [ConcurrentEffects] }),
        { provide: JOURNAL, useFactory: () => journal },
        { provide: OTHER_JOURNAL, useFactory: () => otherJournal },
      ],
    });

    manager = managerOf(ownUpdater);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe("'latest' — the newest answer wins", () => {
    /**
     * The bug this exists for: a slow request answering after a fast one used
     * to overwrite it, so the state ended up holding the older intent.
     */
    it('drops the answer of the run it superseded', async () => {
      const slow = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'slow' }),
      );
      await started('slow');

      const fast = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'fast' }),
      );
      await started('fast');

      gateFor('fast').open();
      await fast;
      gateFor('slow').open();
      await slow;

      expect(journal.applied).toEqual(['fast']);
    });

    it('tells the superseded handler its run was abandoned', async () => {
      const superseded = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'slow' }),
      );
      await started('slow');

      const current = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'fast' }),
      );
      await started('fast');

      gateFor('slow').open();
      gateFor('fast').open();
      await Promise.all([superseded, current]);

      expect(journal.abandoned).toEqual(['slow']);
    });

    /** Nothing is broken, so awaiting an abandoned dispatch reports nothing. */
    it('resolves the dispatch of an abandoned run without failing', async () => {
      const superseded = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'slow' }),
      );
      await started('slow');
      const current = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'fast' }),
      );
      await started('fast');

      gateFor('slow').open();
      gateFor('fast').open();

      await expect(superseded).resolves.not.toThrow();
      await expect(current).resolves.not.toThrow();
    });

    it('swallows the failure of a run it had abandoned', async () => {
      const superseded = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'slow' }),
      );
      await started('slow');
      const current = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'fast' }),
      );
      await started('fast');

      gateFor('slow').fail(new Error('answer nobody awaits'));
      gateFor('fast').open();

      await expect(superseded).resolves.not.toThrow();
      await current;
      expect(journal.applied).toEqual(['fast']);
    });

    /** Two cards dragged at once must both land: the key keeps them apart. */
    it('keeps two concurrency keys from superseding one another', async () => {
      const one = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'one' }),
      );
      const two = manager.dispatchAsync(
        writeActions.request({ entity: 'task-2', value: 'two' }),
      );
      await Promise.all([started('one'), started('two')]);

      gateFor('one').open();
      gateFor('two').open();
      await Promise.all([one, two]);

      expect([...journal.applied].sort()).toEqual(['one', 'two']);
      expect(journal.abandoned).toEqual([]);
    });

    it('unsubscribes from the source of the run it superseded', async () => {
      const superseded = manager.dispatchAsync(streamActions.request('slow'));
      await started('slow');
      expect(sourceFor('slow').observed).toBe(true);

      const current = manager.dispatchAsync(streamActions.request('fast'));
      await started('fast');

      expect(sourceFor('slow').observed).toBe(false);

      sourceFor('fast').next(streamActions.success('fast'));
      sourceFor('fast').complete();
      await Promise.all([superseded, current]);

      expect(journal.applied).toEqual(['fast']);
    });
  });

  describe("'first' — the run in flight wins", () => {
    it('starts no second run while the first is in flight', async () => {
      const first = manager.dispatchAsync(submitActions.request('once'));
      await started('once');

      const second = manager.dispatchAsync(submitActions.request('twice'));

      gateFor('once').open();
      await Promise.all([first, second]);

      expect(journal.started).toEqual(['once']);
      expect(journal.applied).toEqual(['once']);
    });

    it('runs again once the one in flight has answered', async () => {
      const first = manager.dispatchAsync(submitActions.request('once'));
      await started('once');
      gateFor('once').open();
      await first;

      const again = manager.dispatchAsync(submitActions.request('twice'));
      await started('twice');
      gateFor('twice').open();
      await again;

      expect(journal.applied).toEqual(['once', 'twice']);
    });

    /**
     * The policy governs effects, never state: a dispatch whose handler is
     * skipped still goes through its updater.
     */
    it('applies the updater of the dispatch it ran nothing for', async () => {
      const applied: unknown[] = [];
      const counting = defineUpdater(JOURNAL, (on) => {
        on(submitActions.request, (_state, value) => {
          applied.push(value);
        });
        // Claimed so the cascaded success is not misrouted out of this scope.
        // What this spec watches is the request alone.
        on(submitActions.success, () => undefined);
      });
      const countingManager = managerOf(counting);

      const first = countingManager.dispatchAsync(
        submitActions.request('once'),
      );
      await started('once');
      const second = countingManager.dispatchAsync(
        submitActions.request('twice'),
      );

      gateFor('once').open();
      await Promise.all([first, second]);

      expect(applied).toEqual(['once', 'twice']);
      expect(journal.started).toEqual(['once']);
    });
  });

  describe('cancelOn', () => {
    it('abandons the run in flight when its cancelling action is dispatched', async () => {
      const abandoned = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'dropped' }),
      );
      await started('dropped');

      await manager.dispatchAsync(writeActions.cancel());
      gateFor('dropped').open();
      await abandoned;

      expect(journal.abandoned).toEqual(['dropped']);
      expect(journal.applied).toEqual([]);
    });

    it('abandons every concurrency key at once', async () => {
      const one = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'one' }),
      );
      const two = manager.dispatchAsync(
        writeActions.request({ entity: 'task-2', value: 'two' }),
      );
      await Promise.all([started('one'), started('two')]);

      await manager.dispatchAsync(writeActions.cancel());
      gateFor('one').open();
      gateFor('two').open();
      await Promise.all([one, two]);

      expect(journal.applied).toEqual([]);
      expect([...journal.abandoned].sort()).toEqual(['one', 'two']);
    });

    /** Cancellation is scoped like dispatch: a manager abandons its own runs. */
    it('leaves the runs of another manager alone', async () => {
      const other = managerOf(otherUpdater);
      const mine = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'mine' }),
      );
      const theirs = other.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'theirs' }),
      );
      await Promise.all([started('mine'), started('theirs')]);

      await manager.dispatchAsync(writeActions.cancel());
      gateFor('mine').open();
      gateFor('theirs').open();
      await Promise.all([mine, theirs]);

      expect(journal.applied).toEqual([]);
      expect(otherJournal.applied).toEqual(['theirs']);
    });

    it('lets a new run start right after a cancellation', async () => {
      const abandoned = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'dropped' }),
      );
      await started('dropped');
      await manager.dispatchAsync(writeActions.cancel());

      const kept = manager.dispatchAsync(
        writeActions.request({ entity: 'task-1', value: 'kept' }),
      );
      await started('kept');

      gateFor('dropped').open();
      gateFor('kept').open();
      await Promise.all([abandoned, kept]);

      expect(journal.applied).toEqual(['kept']);
    });
  });
});
