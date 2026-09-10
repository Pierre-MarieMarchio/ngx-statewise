import {
  ErrorHandler,
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
import {
  DEFAULT_MAX_CASCADE_DEPTH,
  MAX_CASCADE_DEPTH,
} from '../dispatch/cascade-depth';
import { GlobalUpdaterRegistry } from '../dispatch/global-updater-registry';
import { StatewiseEngine } from '../dispatch/statewise-engine';
import {
  defaultMisroutedDispatchReaction,
  MISROUTED_DISPATCH_REACTION,
  type MisroutedDispatchReaction,
} from '../dispatch/misrouted-dispatch';
import { EffectRegistry } from '../effect/effect-registry';
import { PendingEffects } from '../effect/pending-effects';
import { InterceptorRegistry } from '../interceptor/interceptor-registry';
import { RunningEffects } from '../effect/running-effects';
import { indexUpdaters, resolveUpdaters } from '../updater/resolve-updaters';
import type { Updater } from '../updater/updater-definition';
import {
  defaultDuplicateProviderReaction,
  DUPLICATE_PROVIDER_REACTION,
  guardSingleProvider,
  STATEWISE_PROVIDED,
  type DuplicateProviderReaction,
} from './duplicate-provider';

/** How many of the last dispatched actions are kept, and in what shape. */
export interface StatewiseHistoryOptions {
  readonly limit: number;
  /**
   * Replaces an action before it is recorded, so what the history keeps need
   * not be what was dispatched. Return the action untouched to keep it.
   *
   * The history is verbatim by design, so whatever an action carries is kept
   * with it, a password or a token included. This is where to strip that.
   */
  readonly redact?: ActionRedaction;
}

export interface StatewiseConfig {
  /** Effect classes, instantiated at startup so their effects register. */
  readonly effects?: readonly Type<unknown>[];
  /**
   * Interceptor classes, instantiated at startup so their interceptors
   * register.
   *
   * Mechanically the same as `effects`, a class the application instantiates
   * eagerly, and separate for one reason: a class declaring nothing but
   * interceptors had to be listed under `effects`, which named it wrong at
   * every call site. `effects` still accepts one, so nothing has to move.
   */
  readonly interceptors?: readonly Type<unknown>[];
  /**
   * Updaters answering the action types no manager claims.
   *
   * A fallback rather than an addition. The engine reads a scoped updater
   * first and only comes here when none matched, so an updater listed here
   * never fires for a type a manager already owns. Give a global updater
   * action types of its own; one sharing a type with a manager's updater
   * silently never runs.
   *
   * Reachable from whichever manager dispatches, `injectStatewise()` with no
   * updater at all included.
   */
  readonly updaters?: readonly Updater<unknown>[];
  /** Action history, disabled unless configured. */
  readonly history?: StatewiseHistoryOptions;
  /**
   * What a dispatch reaching the wrong manager does. Throws in development,
   * reports to the `ErrorHandler` in production.
   */
  readonly misroutedDispatch?: MisroutedDispatchReaction;
  /**
   * How many actions one cascade may chain, the dispatched action included.
   * Beyond it the cascade is stopped and the whole path is raised, which is
   * what keeps two effects returning each other's action from exhausting the
   * heap. Must be a positive integer.
   *
   * @default 50
   */
  readonly maxCascadeDepth?: number;
}

/**
 * Wires the execution engine, the effects and the global updaters.
 *
 * Call it once, at the application root. A second call in a child injector,
 * typically the providers of a lazy route, builds a second engine with its
 * own effect registry, which no dispatch of the application reaches; the
 * initializer below refuses that rather than letting it detach in silence.
 */
export function provideStatewise(
  config: StatewiseConfig = {},
): EnvironmentProviders {
  const historyLimit = resolveHistoryLimit(config.history);
  const maxCascadeDepth = resolveMaxCascadeDepth(config.maxCascadeDepth);
  const effects = config.effects ?? [];
  const interceptors = config.interceptors ?? [];
  const updaters = config.updaters ?? [];

  return makeEnvironmentProviders([
    EffectRegistry,
    InterceptorRegistry,
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
    { provide: MAX_CASCADE_DEPTH, useValue: maxCascadeDepth },
    {
      provide: MISROUTED_DISPATCH_REACTION,
      useFactory: (): MisroutedDispatchReaction =>
        config.misroutedDispatch ??
        defaultMisroutedDispatchReaction(isDevMode()),
    },
    { provide: STATEWISE_PROVIDED, useValue: true },
    {
      provide: DUPLICATE_PROVIDER_REACTION,
      useFactory: (): DuplicateProviderReaction =>
        defaultDuplicateProviderReaction(isDevMode()),
    },
    ...effects,
    ...interceptors,
    provideEnvironmentInitializer(() => {
      // Asked before anything is wired, so a call that is not going to be
      // reachable does not first instantiate the effect classes of a registry
      // nothing will read.
      guardSingleProvider(
        inject(STATEWISE_PROVIDED, { optional: true, skipSelf: true }),
        inject(DUPLICATE_PROVIDER_REACTION),
        inject(ErrorHandler),
      );

      const injector = inject(Injector);
      const globalUpdaters = inject(GlobalUpdaterRegistry);

      globalUpdaters.set(indexUpdaters(resolveUpdaters(injector, updaters)));

      // Both lists are instantiated the same way, and for the same reason: a
      // declaration only registers when the class holding it is constructed.
      effects.forEach((effect) => injector.get(effect));
      interceptors.forEach((interceptor) => injector.get(interceptor));
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

/**
 * Rejects a bound that would not bound anything. Zero or less would stop
 * every cascade at its root, which is not a smaller limit but a different
 * behaviour: `execute` would throw before applying any updater at all.
 */
function resolveMaxCascadeDepth(maxCascadeDepth: number | undefined): number {
  if (maxCascadeDepth === undefined) {
    return DEFAULT_MAX_CASCADE_DEPTH;
  }

  if (!Number.isInteger(maxCascadeDepth) || maxCascadeDepth <= 0) {
    throw new Error(
      '[ngx-statewise] maxCascadeDepth must be a positive integer.',
    );
  }

  return maxCascadeDepth;
}
