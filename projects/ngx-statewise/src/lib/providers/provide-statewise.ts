import {
  inject,
  Injector,
  isDevMode,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  type EnvironmentProviders,
  type Type,
} from '@angular/core';

import {
  ACTION_HISTORY_LIMIT,
  ACTION_HISTORY_REDACTION,
  ActionHistory,
  keepAction,
  type ActionRedaction,
} from '../dispatch/action-history';
import { GlobalUpdaterRegistry } from '../dispatch/global-updater-registry';
import { StatewiseEngine } from '../dispatch/statewise-engine';
import {
  defaultMisroutedDispatchReaction,
  MISROUTED_DISPATCH_REACTION,
  type MisroutedDispatchReaction,
} from '../dispatch/misrouted-dispatch';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import { RunningEffects } from '../effect/running-effects';
import { indexUpdaters, resolveUpdaters } from '../updater/resolve-updaters';
import type { Updater } from '../updater/updater-definition';

/** How many of the last dispatched actions are kept, and in what shape. */
export interface StatewiseHistoryOptions {
  readonly limit: number;
  /**
   * Replaces an action before it is recorded, so what the history keeps need
   * not be what was dispatched. Return the action untouched to keep it.
   *
   * The history is verbatim by design, so whatever an action carries — a
   * password, a token — is kept with it. This is where to strip that.
   */
  readonly redact?: ActionRedaction;
}

export interface StatewiseConfig {
  /** Effect classes, instantiated at startup so their effects register. */
  readonly effects?: readonly Type<unknown>[];
  /**
   * Updaters reachable from whichever manager dispatches, `injectStatewise()`
   * with no updater at all included. They answer the action types no manager
   * claims: a scoped updater always wins over a global one, so a type already
   * owned by a manager never reaches these.
   */
  readonly updaters?: readonly Updater<unknown>[];
  /** Action history, disabled unless configured. */
  readonly history?: StatewiseHistoryOptions;
  /**
   * What a dispatch reaching the wrong manager does. Throws in development,
   * reports to the `ErrorHandler` in production.
   */
  readonly misroutedDispatch?: MisroutedDispatchReaction;
}

/** Wires the execution engine, the effects and the global updaters. */
export function provideStatewise(
  config: StatewiseConfig = {},
): EnvironmentProviders {
  const historyLimit = resolveHistoryLimit(config.history);
  const effects = config.effects ?? [];
  const updaters = config.updaters ?? [];

  return makeEnvironmentProviders([
    EffectRegistry,
    PendingEffects,
    RunningEffects,
    GlobalUpdaterRegistry,
    ActionHistory,
    StatewiseEngine,
    { provide: ACTION_HISTORY_LIMIT, useValue: historyLimit },
    {
      provide: ACTION_HISTORY_REDACTION,
      useValue: config.history?.redact ?? keepAction,
    },
    {
      provide: MISROUTED_DISPATCH_REACTION,
      useFactory: (): MisroutedDispatchReaction =>
        config.misroutedDispatch ??
        defaultMisroutedDispatchReaction(isDevMode()),
    },
    ...effects,
    provideEnvironmentInitializer(() => {
      const injector = inject(Injector);
      const globalUpdaters = inject(GlobalUpdaterRegistry);

      globalUpdaters.set(indexUpdaters(resolveUpdaters(injector, updaters)));
      effects.forEach((effect) => injector.get(effect));
    }),
  ]);
}

function resolveHistoryLimit(
  history: StatewiseHistoryOptions | undefined,
): number {
  if (history === undefined) {
    return 0;
  }

  if (!Number.isInteger(history.limit) || history.limit <= 0) {
    throw new Error(
      '[ngx-statewise] history.limit must be a positive integer.',
    );
  }

  return history.limit;
}
