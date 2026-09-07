import type { ErrorHandler } from '@angular/core';

import type { Action } from '../action';
import type { DispatchScope } from './dispatch-scope';
import type { StatewiseEngine } from './statewise-engine';

/**
 * What identifies an action type: an action creator, or an action itself.
 * Both carry a `type`, so both are accepted.
 */
export interface ActionIdentity {
  readonly type: string;
}

/**
 * The dispatch handle a manager gets from `injectStatewise`. Dispatch and
 * effect observation are scoped to this handle; the recorded actions are
 * application-wide.
 */
export interface Statewise {
  dispatch(action: Action): void;
  dispatchAsync(action: Action): Promise<void>;
  waitForEffect(action: ActionIdentity): Promise<void>;
  waitForAllEffects(): Promise<void>;
  recordedActions(): readonly Action[];
}

/** The handle bound to the updaters of one `injectStatewise` call. */
export class ScopedStatewiseRef implements Statewise {
  public constructor(
    private readonly engine: StatewiseEngine,
    private readonly scope: DispatchScope,
    private readonly errorHandler: ErrorHandler,
  ) {}

  public dispatch(action: Action): void {
    const execution = this.engine.execute(action, this.scope);

    void execution.catch((error: unknown) => {
      this.errorHandler.handleError(error);
    });
  }

  public async dispatchAsync(action: Action): Promise<void> {
    return this.engine.execute(action, this.scope);
  }

  /** Waits only for the effects this handle started for that action type. */
  public waitForEffect(action: ActionIdentity): Promise<void> {
    return this.engine.waitForEffect(this.scope, action.type);
  }

  /** Waits only for the effects this handle started. */
  public waitForAllEffects(): Promise<void> {
    return this.engine.waitForAllEffects(this.scope);
  }

  public recordedActions(): readonly Action[] {
    return this.engine.recordedActions();
  }
}
