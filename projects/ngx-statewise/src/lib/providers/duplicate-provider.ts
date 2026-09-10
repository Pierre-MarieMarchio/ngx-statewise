import { InjectionToken, type ErrorHandler } from '@angular/core';

/**
 * What a second `provideStatewise()` does.
 *
 * The same rule as a misrouted dispatch, for the same reason: development
 * throws, so the mistake is impossible to miss, while production reports and
 * carries on, because taking a running application down is worse than the
 * effects that are already detached.
 */
export type DuplicateProviderReaction = 'throw' | 'report';

/**
 * Left in the injector of every `provideStatewise()` call, and looked for in
 * the parents of the next one.
 *
 * A marker rather than a counter: what matters is whether an ancestor already
 * provides the engine, not how many do.
 */
export const STATEWISE_PROVIDED = new InjectionToken<true>(
  'STATEWISE_PROVIDED',
);

/** Selects the reaction. Defaults to Angular's dev mode. */
export const DUPLICATE_PROVIDER_REACTION =
  new InjectionToken<DuplicateProviderReaction>('DUPLICATE_PROVIDER_REACTION');

/**
 * The reaction to use when the application did not choose one.
 *
 * Takes the dev-mode flag rather than reading it, so both arms are reachable
 * from a test: a `TestBed` always runs in development mode.
 */
export function defaultDuplicateProviderReaction(
  devMode: boolean,
): DuplicateProviderReaction {
  return devMode ? 'throw' : 'report';
}

/**
 * Raised when `provideStatewise()` was already called by a parent injector.
 *
 * Names the consequence rather than the rule, because the rule alone would not
 * explain why the symptom is so quiet: the state moves, so the action looks
 * like it worked.
 */
export function duplicateProviderError(): Error {
  return new Error(
    `[ngx-statewise] provideStatewise() has already been called by a parent ` +
      `injector. It provides its own effect registry, so the effects ` +
      `declared here register into a registry no dispatch of the ` +
      `application reaches: their updaters still apply, and their effects ` +
      `never run. That looks like it worked, because the state moves. ` +
      `Call provideStatewise() once, at the application root. An effect ` +
      `class scoped to a lazy route or to a component needs no second call: ` +
      `createEffect() registers into the root registry from wherever it is ` +
      `injected.`,
  );
}

/**
 * Refuses a second `provideStatewise()` in a child injector.
 *
 * `providedByParent` is what `inject(STATEWISE_PROVIDED, { optional: true,
 * skipSelf: true })` answered: the sentinel this very call provides is skipped,
 * so only an ancestor's counts.
 */
export function guardSingleProvider(
  providedByParent: true | null,
  reaction: DuplicateProviderReaction,
  errorHandler: ErrorHandler,
): void {
  if (providedByParent === null) {
    return;
  }

  if (reaction === 'throw') {
    throw duplicateProviderError();
  }

  errorHandler.handleError(duplicateProviderError());
}
