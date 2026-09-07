import { Injectable } from '@angular/core';

interface TrackedEffect {
  readonly scope: object;
  readonly effect: Promise<void>;
}

/**
 * Tracks the effects currently running, tagged with the dispatch scope that
 * started them. A manager observes only its own effects; the unscoped view
 * exists for tests and tooling.
 */
@Injectable()
export class PendingEffects {
  private readonly pending = new Map<string, Set<TrackedEffect>>();

  /** Registers a running effect and returns it untouched, rejection included. */
  public track(
    scope: object,
    actionType: string,
    effect: Promise<void>,
  ): Promise<void> {
    const occurrences =
      this.pending.get(actionType) ?? new Set<TrackedEffect>();
    const tracked: TrackedEffect = { scope, effect };

    occurrences.add(tracked);
    this.pending.set(actionType, occurrences);

    // Holding the set in the closure keeps the cleanup exact: the entry is
    // dropped from the map only once its own last occurrence is over.
    const forget = (): void => {
      occurrences.delete(tracked);

      if (occurrences.size === 0) {
        this.pending.delete(actionType);
      }
    };

    effect.then(forget, forget);

    return effect;
  }

  public waitFor(scope: object, actionType: string): Promise<void> {
    return settle(matching(this.pending.get(actionType), scope));
  }

  public waitForScope(scope: object): Promise<void> {
    return settle(this.collect(scope));
  }

  /** Every effect in flight, whichever scope started it. */
  public waitForAll(): Promise<void> {
    return settle(this.collect(undefined));
  }

  private collect(scope: object | undefined): readonly Promise<void>[] {
    const all: Promise<void>[] = [];

    for (const occurrences of this.pending.values()) {
      all.push(...matching(occurrences, scope));
    }

    return all;
  }
}

function matching(
  occurrences: ReadonlySet<TrackedEffect> | undefined,
  scope: object | undefined,
): readonly Promise<void>[] {
  if (occurrences === undefined) {
    return [];
  }

  const selected: Promise<void>[] = [];

  for (const tracked of occurrences) {
    if (scope === undefined || tracked.scope === scope) {
      selected.push(tracked.effect);
    }
  }

  return selected;
}

/**
 * Waits for completion, not for success: a failing effect is reported to
 * whoever awaited its dispatch, never to an unrelated observer.
 */
async function settle(occurrences: readonly Promise<void>[]): Promise<void> {
  if (occurrences.length === 0) {
    return;
  }

  await Promise.allSettled(occurrences);
}
