import { Inject, Injectable, InjectionToken } from '@angular/core';

import type { Action } from '../action';

/** How many actions the history keeps. Zero disables it. */
export const ACTION_HISTORY_LIMIT = new InjectionToken<number>(
  'ACTION_HISTORY_LIMIT',
);

/** The last dispatched actions, oldest first. Disabled unless configured. */
@Injectable()
export class ActionHistory {
  private actions: Action[] = [];

  public constructor(
    @Inject(ACTION_HISTORY_LIMIT) private readonly limit: number,
  ) {}

  public record(action: Action): void {
    if (this.limit === 0) {
      return;
    }

    this.actions.push(action);

    if (this.actions.length > this.limit) {
      this.actions.shift();
    }
  }

  public snapshot(): readonly Action[] {
    return [...this.actions];
  }
}
