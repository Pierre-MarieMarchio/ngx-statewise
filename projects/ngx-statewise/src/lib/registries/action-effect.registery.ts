import { Injectable } from "@angular/core";
import { Action } from "../action/interfaces/action-type";

@Injectable({ providedIn: 'root' })
export class ActionEffectRegistry {
  private readonly _effects = new Map<string, ((action: Action) => void)[]>();

  public register(actionType: string, effect: (action: Action) => void): void {
    const list = this._effects.get(actionType) || [];
    this._effects.set(actionType, [...list, effect]);
  }

  public get(actionType: string): ((action: Action) => void)[] {
    return this._effects.get(actionType) || [];
  }

  public has(actionType: string): boolean {
    return !!this._effects.get(actionType)?.length;
  }
}
