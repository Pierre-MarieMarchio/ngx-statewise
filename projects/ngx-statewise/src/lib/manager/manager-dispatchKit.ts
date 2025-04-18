import { Action } from "../action/action-type";
import { EffectHandler } from "../effect/effect-handler";
import { IUpdator } from "../updator/updator-interfaces";
import { registerFullUpdator } from "../updator/updator-registery";


import { StateStore } from "./manager-store";

export function dispatch<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): void {
  registerFullUpdator(updator);
  StateStore.getInstance().dispatch(action, updator);
}

export function dispatchAsync<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): Promise<void> {

  dispatch(action, updator);

  return EffectHandler.getInstance().waitForEffects(action.type);
}