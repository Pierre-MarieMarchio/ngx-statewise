import { EffectHandler } from '../effect/effect-handler';
import { IUpdator } from '../updator/updator-interfaces';
import { Action } from '../action/action-type';
import { update } from '../updator/updator-utils';

/**
 * Singleton class that coordinates state updates and effect handling
 * in response to dispatched actions.
 */
export class StateStore {
  private static instance: StateStore;
  private readonly _EffectHandler: EffectHandler = EffectHandler.getInstance();

  private constructor() {}

  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  public dispatch<S>(action: Action, updator: IUpdator<S>): void {
    console.log('in dispatch', action.type);

    update(updator.state, action, updator.updators);
    this._EffectHandler.emit(action);
  }

  public dispatshAsync<S>(action: Action, updator: IUpdator<S>): Promise<void> {
    this.dispatch<S>(action, updator);
    return this._EffectHandler.waitForEffects(action.type);
  }
}

