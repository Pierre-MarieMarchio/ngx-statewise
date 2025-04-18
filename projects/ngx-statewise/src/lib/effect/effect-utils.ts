import { EffectHandler } from "./effect-handler";

export function waitForAllEffects(): Promise<void> {
  return EffectHandler.getInstance().waitForAllEffects();
}

export function waitForEffect(actionType: string): Promise<void> {
  return EffectHandler.getInstance().waitForEffects(actionType);
}
