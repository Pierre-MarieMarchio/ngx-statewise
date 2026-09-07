import { Injectable } from '@angular/core';

import type { RegisteredEffect } from './registered-effect';

const NO_EFFECTS: readonly RegisteredEffect[] = [];

/** Holds the effects registered for each action type. */
@Injectable()
export class EffectRegistry {
  private readonly effects = new Map<string, readonly RegisteredEffect[]>();

  public register(actionType: string, effect: RegisteredEffect): void {
    this.effects.set(actionType, [...this.get(actionType), effect]);
  }

  /** Drops one registration, so an effect dies with the injector owning it. */
  public unregister(actionType: string, effect: RegisteredEffect): void {
    const remaining = this.get(actionType).filter(
      (registered) => registered !== effect,
    );

    if (remaining.length === 0) {
      this.effects.delete(actionType);
      return;
    }

    this.effects.set(actionType, remaining);
  }

  public get(actionType: string): readonly RegisteredEffect[] {
    return this.effects.get(actionType) ?? NO_EFFECTS;
  }
}
