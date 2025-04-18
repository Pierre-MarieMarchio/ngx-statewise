import { EffectHandler } from '../effect/effect-handler';
import { IUpdator } from '../updator/updator-interfaces';
import { Action } from '../action/action-type';
import { update } from '../updator/updator-utils';

/**
 * Singleton class responsible for coordinating state updates and handling effects
 * in response to dispatched actions.
 *
 * Manages the central flow of actions and updates the state using registered
 * updators, while also triggering effects via the EffectHandler.
 */
export class StateStore {
  private static instance: StateStore;
  private readonly _EffectHandler: EffectHandler = EffectHandler.getInstance();

  private constructor() {}

  /**
   * Returns the singleton instance of the StateStore.
   *
   * @returns {StateStore} The global StateStore instance.
   */
  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  /**
   * Dispatches an action and updates the state using the provided updator.
   *
   * This method invokes the specified updator to modify the state based on the
   * dispatched action. It also triggers any associated effects.
   *
   * @param action - The action to be dispatched.
   * @param updator - The state updator function that modifies the state.
   */
  public dispatch<S>(action: Action, updator: IUpdator<S>): void {
    console.log('in dispatch', action.type);

    // Update the state based on the action
    update(updator.state, action, updator.updators);

    // Emit the action to trigger effects
    this._EffectHandler.emit(action);
  }

  /**
   * Dispatches an action asynchronously and waits for all related effects to resolve.
   *
   * This method dispatches the action, updates the state, and waits for any associated
   * effects to be completed before the promise resolves.
   *
   * @param action - The action to be dispatched.
   * @param updator - The state updator function that modifies the state.
   * @returns A promise that resolves when all effects related to the action are completed.
   */
  public dispatshAsync<S>(action: Action, updator: IUpdator<S>): Promise<void> {
    // Dispatch the action and update the state
    this.dispatch<S>(action, updator);

    // Wait for any effects triggered by the action to complete
    return this._EffectHandler.waitForEffects(action.type);
  }
}
