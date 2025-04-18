
import { Action } from "../action";
import { EffectHandler } from "../effect/effect-handler";

import { IUpdator, registerFullUpdator } from "../updator";
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