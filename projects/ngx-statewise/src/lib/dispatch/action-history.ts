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

/**
 * One recorded action, and what the history knows about it beyond itself.
 *
 * A type of its own rather than an enriched `Action`, and deliberately so:
 * `Action` is what an application dispatches, and adding fields to it would
 * make every action look like it carries a cascade. Reading the history and
 * dispatching are two different things, so they get two different shapes.
 */
export interface HistoryEntry {
  /** The action, as the redaction left it. */
  readonly action: Action;
  /**
   * The chain of action types that led here, this action last.
   *
   * A single dispatch reads as one entry; a cascade of three reads as three
   * whose paths extend each other. This is the field that tells two concurrent
   * dispatches of one action type apart, and the engine has always computed it
   * — it is what the cascade-bound error prints.
   */
  readonly cascade: readonly string[];
  /**
   * When the entry was recorded, from `Date.now()`.
   *
   * The recording, not the dispatch: the two are the same turn of the loop, and
   * the history has no business claiming to know more than it saw.
   */
  readonly recordedAt: number;
}

/** The last dispatched actions, oldest first. Disabled unless configured. */
@Injectable()
export class ActionHistory {
  private entries: HistoryEntry[] = [];

  public constructor(
    @Inject(ACTION_HISTORY_LIMIT) private readonly limit: number,
    @Inject(ACTION_HISTORY_REDACTION) private readonly redact: ActionRedaction,
  ) {}

  /**
   * `cascade` is the path the engine already holds, and the reason this method
   * takes two arguments instead of one. The redaction still sees the action
   * alone: what an application strips is a payload, never a path.
   */
  public record(action: Action, cascade: readonly string[]): void {
    if (this.limit === 0) {
      return;
    }

    this.entries.push(entryOf(this.redact(action), cascade));

    if (this.entries.length > this.limit) {
      this.entries.shift();
    }
  }

  public snapshot(): readonly HistoryEntry[] {
    return [...this.entries];
  }
}

/**
 * An envelope of the history's own, frozen: an entry already handed out cannot
 * be rewritten through the array `snapshot` returns, and recording no longer
 * hands the very object the engine is executing. The path is copied for the
 * same reason — the engine goes on building on its own array.
 *
 * The payload keeps its identity, deliberately. Copying it would require
 * knowing how, and a `Date`, a `Map` or a class instance does not survive a
 * naive clone. The cost is stated in the guide: a payload the application
 * mutates afterwards changes what the history shows of the past, so do not
 * mutate one — and use `redact` for what should not be kept at all.
 */
function entryOf(action: Action, cascade: readonly string[]): HistoryEntry {
  return Object.freeze({
    action: Object.freeze({ ...action }),
    cascade: Object.freeze([...cascade]),
    recordedAt: Date.now(),
  });
}
