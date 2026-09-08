import { Injectable } from '@angular/core';

import { hasRunPolicy, type RegisteredEffect } from './registered-effect';

/**
 * One run of an effect, as the engine holds it.
 *
 * The shape mirrors `EffectRef`: a handle carrying what the caller needs and a
 * method releasing it, rather than an identifier to hand back around.
 */
export interface EffectRun {
  /** Given to the handler, and watched by the engine to drop a stale answer. */
  readonly abortSignal: AbortSignal;
  /** Releases the run once its answer is in, abandoned or not. */
  finish(): void;
}

/** The runs competing under one concurrency key. */
type RunGroup = Set<AbortController>;

/** Every group of one effect within one dispatch scope, keyed by its key. */
type ScopedGroups = Map<string, RunGroup>;

/**
 * Tracks the runs in flight and applies the concurrency policy to a new one.
 *
 * A run belongs to the group identified by its effect, its dispatch scope and
 * its concurrency key. Only the runs of one group compete; everything else
 * goes on side by side, exactly as before this existed.
 *
 * Effects and scopes are held weakly, so a destroyed manager or a discarded
 * effect takes its groups with it.
 */
@Injectable()
export class RunningEffects {
  private readonly groups = new WeakMap<
    RegisteredEffect,
    WeakMap<object, ScopedGroups>
  >();

  /**
   * Opens a run under the policy of its effect, or answers `undefined` when
   * that policy says this dispatch runs no handler at all.
   */
  public start(
    effect: RegisteredEffect,
    scope: object,
    key: string,
  ): EffectRun | undefined {
    const controller = new AbortController();

    if (!hasRunPolicy(effect)) {
      return untrackedRun(controller);
    }

    const groups = this.groupsOf(effect, scope);
    const runs = groups.get(key) ?? new Set<AbortController>();

    if (runs.size > 0) {
      if (effect.concurrency === 'first') {
        return undefined;
      }

      abandon(runs);
    }

    runs.add(controller);
    groups.set(key, runs);

    return {
      abortSignal: controller.signal,
      finish: () => {
        runs.delete(controller);

        // Dropped once its last run is over, so an effect keyed by entity does
        // not keep one empty group per entity it has ever seen.
        if (runs.size === 0) {
          groups.delete(key);
        }
      },
    };
  }

  /** Abandons every run this effect has in flight for that scope. */
  public cancel(effect: RegisteredEffect, scope: object): void {
    const groups = this.groups.get(effect)?.get(scope);

    if (groups === undefined) {
      return;
    }

    for (const runs of groups.values()) {
      abandon(runs);
    }
  }

  private groupsOf(effect: RegisteredEffect, scope: object): ScopedGroups {
    const scopes =
      this.groups.get(effect) ?? new WeakMap<object, ScopedGroups>();
    this.groups.set(effect, scopes);

    const groups = scopes.get(scope) ?? new Map<string, RunGroup>();
    scopes.set(scope, groups);

    return groups;
  }
}

/**
 * A run nothing competes with and nothing cancels. It still carries a signal,
 * never fired, so a handler reads one shape whatever the policy.
 */
function untrackedRun(controller: AbortController): EffectRun {
  return {
    abortSignal: controller.signal,
    finish: () => undefined,
  };
}

/**
 * Aborts the runs of a group and forgets them at once: an abandoned run must
 * not be waited for, nor abandoned a second time by the next dispatch.
 */
function abandon(runs: RunGroup): void {
  for (const controller of runs) {
    controller.abort();
  }

  runs.clear();
}
