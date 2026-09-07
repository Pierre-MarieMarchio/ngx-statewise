import { inject, Injectable } from '@angular/core';

import { UpdatorResolver } from '../resolvers/updator.resolver';
import { IUpdator } from '../../../updator';
import { Action } from '../../../action/interfaces/action-type';
import { ActionDispatcherService } from '../../../action/services/action-dispatcher.service';
import { update } from '../../../updator/utils/updator.utils';
import {
  createDispatchExecution,
  DispatchExecution,
} from '../../interfaces/dispatch-execution';

@Injectable({ providedIn: 'root' })
export class DispatchHandler {
  private readonly actionDispatcher = inject(ActionDispatcherService);
  private readonly updatorResolver = inject(UpdatorResolver);

  public start<T extends Action, S>(
    action: T,
    contextOrUpdator?: object | IUpdator<S>
  ): Promise<void> {
    const execution = createDispatchExecution(contextOrUpdator);
    const updator = this.updatorResolver.resolveRoot(
      action.type,
      contextOrUpdator
    );

    return this.execute(action, execution, updator);
  }

  public continue(
    action: Action,
    execution: DispatchExecution
  ): Promise<void> {
    const updator = this.updatorResolver.resolveContinuation(
      action.type,
      execution.contextOrUpdator
    );

    return this.execute(action, execution, updator);
  }

  private execute<S>(
    action: Action,
    execution: DispatchExecution,
    updator?: IUpdator<S>
  ): Promise<void> {
    if (updator) {
      update(updator.state, action, updator.updators);
    }

    return this.actionDispatcher.emit(action, execution);
  }
}
