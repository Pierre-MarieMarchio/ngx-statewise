import { expect } from 'vitest';

import type { Action } from '../lib/action';

/**
 * The history entry a spec expects, with the timestamp left to the one spec
 * that is about it.
 *
 * A clock value asserted everywhere would say nothing and break whenever it
 * ticked, so `expect.any(Number)` stands in for it — while the fields the
 * entry exists for, the action and its cascade path, are asserted exactly.
 */
export function historyEntry(
  action: Action,
  cascade: readonly string[],
): unknown {
  // `expect.any` is typed `any`, and the library forbids that: narrowed here
  // once rather than at each of the call sites.
  const anyNumber: unknown = expect.any(Number);

  return { action, cascade, recordedAt: anyNumber };
}
