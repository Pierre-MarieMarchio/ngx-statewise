import { ErrorHandler, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createEffect,
  defineActionsGroup,
  defineSingleAction,
  defineUpdater,
  emptyPayload,
  injectStatewise,
  payload,
  type Statewise,
} from 'ngx-statewise';
import {
  captureStatewiseDeclarations,
  drainEffects,
  provideStatewiseTesting,
} from 'ngx-statewise/testing';

interface Box {
  value: number;
}

const BOX = new InjectionToken<Box>('TESTING_ENTRY_BOX');
const testingActions = defineActionsGroup({
  source: 'testingEntry',
  events: {
    owned: payload<number>(),
    slow: emptyPayload,
  },
});

const ownedUpdater = defineUpdater(BOX, (on) => {
  on(testingActions.owned, (state, value) => {
    state.value = value;
  });
});

let releaseSlow: () => void;

class SlowEffects {
  private readonly slow = createEffect(
    testingActions.slow,
    () =>
      new Promise<void>((resolve) => {
        releaseSlow = resolve;
      }),
  );
}

describe('ngx-statewise/testing', () => {
  let box: Box;
  let handledErrors: unknown[];

  function configure(
    config?: Parameters<typeof provideStatewiseTesting>[0],
  ): void {
    TestBed.configureTestingModule({
      providers: [
        provideStatewiseTesting(config),
        { provide: BOX, useFactory: () => box },
        {
          provide: ErrorHandler,
          useValue: {
            handleError: (error: unknown) => handledErrors.push(error),
          },
        },
      ],
    });
  }

  function scope(...updaters: Parameters<typeof injectStatewise>): Statewise {
    return TestBed.runInInjectionContext(() => injectStatewise(...updaters));
  }

  beforeEach(() => {
    box = { value: 0 };
    handledErrors = [];
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('provideStatewiseTesting', () => {
    it('records the action history without any configuration', async () => {
      configure();

      await scope(ownedUpdater).dispatchAsync(testingActions.owned(1));

      expect(scope().recordedActions()).toEqual([testingActions.owned(1)]);
    });

    it('lets the history options be overridden', async () => {
      configure({ history: { limit: 1 } });
      const statewise = scope(ownedUpdater);

      await statewise.dispatchAsync(testingActions.owned(1));
      await statewise.dispatchAsync(testingActions.owned(2));

      expect(statewise.recordedActions()).toEqual([testingActions.owned(2)]);
    });

    it('keeps the misrouted-dispatch check on by default', async () => {
      configure();

      await expectAsync(
        scope().dispatchAsync(testingActions.owned(1)),
      ).toBeRejectedWithError(/No updater in scope/);
    });

    it('turns the misrouted-dispatch check off on demand', async () => {
      configure({ strict: false });

      await expectAsync(
        scope().dispatchAsync(testingActions.owned(1)),
      ).toBeResolved();
      expect(box.value).toBe(0);
    });

    it('reports nothing either, so a relaxed suite stays quiet', async () => {
      configure({ strict: false });

      await scope().dispatchAsync(testingActions.owned(1));

      expect(handledErrors).toEqual([]);
    });
  });

  describe('drainEffects', () => {
    it('resolves immediately when nothing is running', async () => {
      configure();

      await expectAsync(drainEffects()).toBeResolved();
    });

    it('waits for an effect started by a fire-and-forget dispatch', async () => {
      configure({ effects: [SlowEffects] });
      let drained = false;

      scope().dispatch(testingActions.slow());
      const draining = drainEffects().then(() => {
        drained = true;
      });

      await Promise.resolve();
      expect(drained).toBeFalse();

      releaseSlow();
      await draining;
      expect(drained).toBeTrue();
    });
  });

  describe('captureStatewiseDeclarations', () => {
    it('forgets the updaters declared after the capture', () => {
      configure();
      const restore = captureStatewiseDeclarations();
      const transient = defineSingleAction('TESTING_TRANSIENT', emptyPayload);

      defineUpdater(BOX, (on) => {
        on(transient, () => undefined);
      });

      expect(() => {
        scope().dispatch(transient());
      }).toThrowError(/No updater in scope/);

      restore();

      expect(() => {
        scope().dispatch(transient());
      }).not.toThrow();
    });

    it('keeps the declarations made before the capture', () => {
      configure();
      const restore = captureStatewiseDeclarations();

      restore();

      expect(() => {
        scope().dispatch(testingActions.owned(1));
      }).toThrowError(/No updater in scope/);
    });
  });
});
