import { Inject, Injectable, InjectionToken } from '@angular/core';

import type { Action } from '../action';

/** How many actions the history keeps. Zero disables it. */
export const ACTION_HISTORY_LIMIT = new InjectionToken<number>(
  'ACTION_HISTORY_LIMIT',
);

/**
 * Replaces an action with what the history should keep of it. Returning the
 * action untouched keeps it verbatim.
 */
export type ActionRedaction = (action: Action) => Action;

export const ACTION_HISTORY_REDACTION = new InjectionToken<ActionRedaction>(
  'ACTION_HISTORY_REDACTION',
);

/** The redaction of a history that redacts nothing. */
export const keepAction: ActionRedaction = (action) => action;

/** The last dispatched actions, oldest first. Disabled unless configured. */
@Injectable()
export class ActionHistory {
  private actions: Action[] = [];

  public constructor(
    @Inject(ACTION_HISTORY_LIMIT) private readonly limit: number,
    @Inject(ACTION_HISTORY_REDACTION) private readonly redact: ActionRedaction,
  ) {}

  public record(action: Action): void {
    if (this.limit === 0) {
      return;
    }

    this.actions.push(entryOf(this.redact(action)));

    if (this.actions.length > this.limit) {
      this.actions.shift();
    }
  }

  public snapshot(): readonly Action[] {
    return [...this.actions];
  }
}

/**
 * An envelope of the history's own, frozen: an entry already handed out cannot
 * be rewritten through the array `snapshot` returns, and recording no longer
 * hands the very object the engine is executing.
 *
 * The payload keeps its identity, deliberately. Copying it would require
 * knowing how, and a `Date`, a `Map` or a class instance does not survive a
 * naive clone. The cost is stated in the guide: a payload the application
 * mutates afterwards changes what the history shows of the past, so do not
 * mutate one — and use `redact` for what should not be kept at all.
 */
function entryOf(action: Action): Action {
  return Object.freeze({ ...action });
}
