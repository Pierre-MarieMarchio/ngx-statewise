import { Injectable } from '@angular/core';

import type { RegisteredEffect } from './registered-effect';

const NO_EFFECTS: readonly RegisteredEffect[] = [];

/**
 * Holds the registered effects under the action types that reach them: the one
 * starting a run, and the ones abandoning the runs already in flight.
 */
@Injectable()
export class EffectRegistry {
  private readonly triggers = new Map<string, readonly RegisteredEffect[]>();
  private readonly cancellers = new Map<string, readonly RegisteredEffect[]>();

  public register(actionType: string, effect: RegisteredEffect): void {
    add(this.triggers, actionType, effect);

    for (const cancelType of effect.cancelledBy) {
      add(this.cancellers, cancelType, effect);
    }
  }

  /** Drops one registration, so an effect dies with the injector owning it. */
  public unregister(actionType: string, effect: RegisteredEffect): void {
    remove(this.triggers, actionType, effect);

    for (const cancelType of effect.cancelledBy) {
      remove(this.cancellers, cancelType, effect);
    }
  }

  /** The effects a dispatch of this action type starts. */
  public triggeredBy(actionType: string): readonly RegisteredEffect[] {
    return this.triggers.get(actionType) ?? NO_EFFECTS;
  }

  /** The effects a dispatch of this action type abandons. */
  public cancelledBy(actionType: string): readonly RegisteredEffect[] {
    return this.cancellers.get(actionType) ?? NO_EFFECTS;
  }
}

type EffectIndex = Map<string, readonly RegisteredEffect[]>;

function add(
  index: EffectIndex,
  actionType: string,
  effect: RegisteredEffect,
): void {
  index.set(actionType, [...(index.get(actionType) ?? NO_EFFECTS), effect]);
}

function remove(
  index: EffectIndex,
  actionType: string,
  effect: RegisteredEffect,
): void {
  const remaining = (index.get(actionType) ?? NO_EFFECTS).filter(
    (registered) => registered !== effect,
  );

  if (remaining.length === 0) {
    index.delete(actionType);
    return;
  }

  index.set(actionType, remaining);
}
