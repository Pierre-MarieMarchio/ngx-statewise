import { EffectHandler } from '../effect/effect-handler';
import { Action } from '../action';
import { IUpdator } from '../updator/updator-interfaces';
import { Subject } from 'rxjs';
import { update } from '../updator';

/**
 * Singleton class that coordinates state updates and effect handling
 * in response to dispatched actions.
 */
export class StateStore {
  private static instance: StateStore;
  private readonly effectActionsSubject = new Subject<Action>();

  /**
   * Private constructor. Subscribes to the global EffectHandler to listen
   * for actions emitted by effects.
   */
  private constructor() {
    EffectHandler.getInstance().actions.subscribe((action) => {
      this.effectActionsSubject.next(action);
    });
  }

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
   * Also listens for any resulting actions from side effects and applies them.
   *
   * @template S - The type of the state managed by the updator.
   * @param {Action} action - The action to dispatch.
   * @param {IUpdator<S>} updator - The state container and action-to-reducer map.
   */
  public dispatch<S>(action: Action, updator: IUpdator<S>): void {

    update(updator.state, action, updator.updators);
    EffectHandler.getInstance().emit(action);

    const subscription = this.effectActionsSubject.subscribe((resultAction) => {
      if (resultAction.type !== action.type) {
        update(updator.state, resultAction, updator.updators);
        subscription.unsubscribe();
      }
    });
  }
}

/**
 * Utility function to dispatch an action using the global StateStore instance.
 *
 * @param {T} action - The action to dispatch.
 * @param {IUpdator<S>} updator - The state and reducer map.
 */
export function dispatch<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): void {
  StateStore.getInstance().dispatch(action, updator);
}