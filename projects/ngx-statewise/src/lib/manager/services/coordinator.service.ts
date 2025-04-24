import { IUpdator } from '../../updator/interfaces/updator.interfaces';
import { Action } from '../../action/action-type';
import { update } from '../../updator/utils/updator.utils';

import { ActionDispatcher } from '../../action/action-dispatcher';
import { inject, Injectable } from '@angular/core';
import { PendingEffectRegistry } from '../../registries/pending-effect.registery';

@Injectable({ providedIn: 'root' })
export class CoordinatorService {
  private readonly pendingEffectRegistry = inject(PendingEffectRegistry);
  private readonly actionDispatcher: ActionDispatcher =
    ActionDispatcher.getInstance();

  public dispatch<S>(action: Action, updator: IUpdator<S>): void {
    update(updator.state, action, updator.updators);
    this.actionDispatcher.emit(action);
  }

  public dispatchAsync<S>(action: Action, updator: IUpdator<S>): Promise<void> {
    this.dispatch<S>(action, updator);
    return this.pendingEffectRegistry.waitFor(action.type);
  }
}
