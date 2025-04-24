import { inject, Injectable } from '@angular/core';

import { CoordinatorService } from '../coordinator.service';
import { UpdatorResolver } from '../resolvers/updator.resolver';
import { IUpdator } from '../../../updator';
import { Action } from '../../../action/interfaces/action-type';
import { ActionDispatcherService } from '../../../action/services/action-dispatcher.service';

@Injectable({ providedIn: 'root' })
export class DispatchHandler {
  private readonly coordinator = inject(CoordinatorService);
  private readonly actionDispatcher =  inject(ActionDispatcherService);
  private readonly updatorResolver = inject(UpdatorResolver);

  public handle<T extends Action, S>(
    action: T,
    contextOrUpdator?: object | IUpdator<S>
  ): void {
    const updator = this.updatorResolver.resolveUpdator(
      action.type,
      contextOrUpdator
    );

    if (updator) {
      this.coordinator.dispatch(action, updator);
    }

    this.actionDispatcher.emit(action);
  }
}
