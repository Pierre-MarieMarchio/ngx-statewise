import { EffectHandler } from '../effect/effect-handler';
import { Action } from '../action';
import { IUpdator } from '../updator/updator-interfaces';
import { Subject } from 'rxjs';
import { update } from '../updator';

export class StateStore {
  private static instance: StateStore;
  private readonly effectActionsSubject = new Subject<Action>();

  private constructor() {

    EffectHandler.getInstance().actions.subscribe((action) => {
      this.effectActionsSubject.next(action);
    });
  }

  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  public dispatch<S>(action: Action, updator: IUpdator<S>): void {
    console.log('Dispatching action:', action.type);

    update(updator.state, action, updator.updators);
    EffectHandler.getInstance().emit(action);

    const subscription = this.effectActionsSubject.subscribe((resultAction) => {
      if (resultAction.type !== action.type) {
        console.log('Handling effect result action:', resultAction.type);

        update(updator.state, resultAction, updator.updators);
        subscription.unsubscribe();
      }
    });
  }
}

export function dispatch<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): void {
  StateStore.getInstance().dispatch(action, updator);
}
