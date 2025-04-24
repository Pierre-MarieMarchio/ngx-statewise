import { inject, Injectable } from '@angular/core';
import { ActionDispatcher } from '../../../action/action-dispatcher';
import { CoordinatorService } from '../coordinator.service';
import { UpdatorResolver } from '../resolvers/updator.resolver';
import { IUpdator } from '../../../updator';
import { Action } from '../../../action/action-type';

@Injectable({ providedIn: 'root' })
export class DispatchHandler {
  private readonly coordinator = inject(CoordinatorService);
  private readonly dispatcher = ActionDispatcher.getInstance();
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
    
    this.dispatcher.emit(action);
  }
}
