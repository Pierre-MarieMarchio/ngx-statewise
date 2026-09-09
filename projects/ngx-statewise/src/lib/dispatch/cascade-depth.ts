import { InjectionToken } from '@angular/core';

/**
 * How many actions one cascade may chain, the dispatched action included.
 *
 * A cascade is held from its root: `dispatchAsync` resolves once every action
 * an effect returned is over, so each level retains the next one. An unbounded
 * depth is therefore an unbounded retention, and two effects returning each
 * other's action exhaust the heap rather than merely spinning — in a browser,
 * the tab dies with nothing diagnosable left behind.
 */
export const MAX_CASCADE_DEPTH = new InjectionToken<number>(
  'MAX_CASCADE_DEPTH',
);

/**
 * The bound applied when the application chose none.
 *
 * Legitimate cascades are short: a login answering a success that fetches two
 * collections, each answering its own success, chains four actions. Fifty
 * leaves an order of magnitude of room, so the bound cannot fire on a cascade
 * that was going to end.
 */
export const DEFAULT_MAX_CASCADE_DEPTH = 50;

/**
 * Raised when a cascade chained more actions than the bound allows.
 *
 * Carries the whole path rather than just a count: a cycle is what this
 * catches in practice, and a path reads it out directly — `PING → PONG →
 * PING → …` names both actions holding it.
 */
export function cascadeDepthExceededError(
  path: readonly string[],
  maxDepth: number,
): Error {
  // The engine always passes the action it was called with, so the fallback
  // never runs. It stands in for a guard clause, which would have shown as a
  // branch the suite cannot reach.
  const [start = 'an action'] = path;

  return new Error(
    `[ngx-statewise] The cascade started by "${start}" exceeded ` +
      `maxCascadeDepth (${String(maxDepth)}) and was stopped. Two effects ` +
      `returning each other's action are the usual cause, and the path ` +
      `below reads the cycle out. Break it, or raise the bound with ` +
      `provideStatewise({ maxCascadeDepth: ... }) if the cascade is ` +
      `legitimate.\n${path.join(' → ')}`,
  );
}
