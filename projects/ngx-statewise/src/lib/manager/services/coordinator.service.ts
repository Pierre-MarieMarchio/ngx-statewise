import { IUpdator } from '../../updator/interfaces/updator.interfaces';
import { Action } from '../../action/interfaces/action-type';
import { update } from '../../updator/utils/updator.utils';
import { inject, Injectable } from '@angular/core';
import { PendingEffectRegistry } from '../../registries/pending-effect.registery';
import { ActionDispatcherService } from '../../action/services/action-dispatcher.service';

@Injectable({ providedIn: 'root' })
export class CoordinatorService {
  private readonly pendingEffectRegistry = inject(PendingEffectRegistry);
  private readonly actionDispatcher = inject(ActionDispatcherService);

  public dispatch<S>(action: Action, updator: IUpdator<S>): void {
    update(updator.state, action, updator.updators);
    this.actionDispatcher.emit(action);
  }

  public dispatchAsync<S>(action: Action, updator: IUpdator<S>): Promise<void> {
    this.dispatch<S>(action, updator);
    return this.pendingEffectRegistry.waitFor(action.type);
  }
}
