import { EffectHandler } from '../effect/effect-handler';
import { Action } from '../action';
import { IUpdator } from '../updator/updator-interfaces';
import { registerFullUpdator, update } from '../updator';

/**
 * Singleton class that coordinates state updates and effect handling
 * in response to dispatched actions.
 */
export class StateStore {
  private static instance: StateStore;

  private constructor() {}

  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  public dispatch<S>(action: Action, updator: IUpdator<S>): void {
    console.log('in dispatch', action.type);

    console.log(updator.updators);
    
    // D'abord mettre à jour l'état
    update(updator.state, action, updator.updators);

    // Puis émettre l'action pour déclencher les effects
    EffectHandler.getInstance().emit(action);
  }
}

export function dispatch<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): void {
  registerFullUpdator(updator); 
  StateStore.getInstance().dispatch(action, updator);
}
