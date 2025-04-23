import { IUpdator } from '../updator/updator-interfaces';
import { Action } from '../action/action-type';
import { update } from '../updator/updator-utils';
import { EffectManager } from '../effect/effect-manager';
import { ActionDispatcher } from '../action/action-dispatcher';

export class StateStore {
  private static instance: StateStore;
  private readonly _EffectManager: EffectManager = EffectManager.getInstance();
  private readonly _ActionDispatcher: ActionDispatcher =
    ActionDispatcher.getInstance();

  private constructor() {}

  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  public dispatch<S>(action: Action, updator: IUpdator<S>): void {
    update(updator.state, action, updator.updators);
    this._ActionDispatcher.emit(action);
  }

  public dispatshAsync<S>(action: Action, updator: IUpdator<S>): Promise<void> {
    this.dispatch<S>(action, updator);
    return this._EffectManager.waitFor(action.type);
  }
}
