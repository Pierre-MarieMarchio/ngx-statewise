import { Injectable, inject } from '@angular/core';

import type { Action } from '../../../action/interfaces/action-type';
import { DispatchHandler } from '../../../manager/services/handlers/dispatch.handler';
import type { DispatchExecution } from '../../../manager/interfaces/dispatch-execution';

@Injectable({ providedIn: 'root' })
export class EffectResultHandler {
  private readonly dispatch = inject(DispatchHandler);

  public async handle(
    results: (Action | void)[],
    execution: DispatchExecution
  ): Promise<void> {
    const actions = results.flat().filter((action): action is Action => !!action);
    await Promise.all(
      actions.map((action) => this.dispatch.continue(action, execution))
    );
  }
}
