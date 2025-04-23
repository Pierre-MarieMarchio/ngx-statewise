import { IUpdator } from '../../updator/updator-interfaces';
import { Action } from '../../action/action-type';
import { update } from '../../updator/updator-utils';
import { EffectManager } from '../../effect/effect-manager';
import { ActionDispatcher } from '../../action/action-dispatcher';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StateStore {
  private readonly _EffectManager: EffectManager = EffectManager.getInstance();
  private readonly _ActionDispatcher: ActionDispatcher =
    ActionDispatcher.getInstance();

  public dispatch<S>(action: Action, updator: IUpdator<S>): void {
    update(updator.state, action, updator.updators);
    this._ActionDispatcher.emit(action);
  }

  public dispatshAsync<S>(action: Action, updator: IUpdator<S>): Promise<void> {
    this.dispatch<S>(action, updator);
    return this._EffectManager.waitFor(action.type);
  }
}
