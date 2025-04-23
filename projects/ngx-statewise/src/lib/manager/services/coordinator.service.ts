import { IUpdator } from '../../updator/interfaces/updator.interfaces';
import { Action } from '../../action/action-type';
import { update } from '../../updator/utils/updator.utils';
import { EffectManager } from '../../effect/effect-manager';
import { ActionDispatcher } from '../../action/action-dispatcher';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CoordinatorService {
  private readonly _EffectManager: EffectManager = EffectManager.getInstance();
  private readonly _ActionDispatcher: ActionDispatcher =
    ActionDispatcher.getInstance();

  public dispatch<S>(action: Action, updator: IUpdator<S>): void {
    update(updator.state, action, updator.updators);
    this._ActionDispatcher.emit(action);
  }

  public dispatchAsync<S>(action: Action, updator: IUpdator<S>): Promise<void> {
    this.dispatch<S>(action, updator);
    return this._EffectManager.waitFor(action.type);
  }
}
