import { Injectable } from '@angular/core';
import type { Action } from '../action/interfaces/action-type';
import type { DispatchExecution } from '../manager/interfaces/dispatch-execution';

export type RegisteredEffect = (
  action: Action,
  execution: DispatchExecution
) => Promise<void>;

@Injectable({ providedIn: 'root' })
export class ActionEffectRegistry {
  private readonly _effects = new Map<string, RegisteredEffect[]>();

  public register(actionType: string, effect: RegisteredEffect): void {
    const list = this._effects.get(actionType) || [];
    this._effects.set(actionType, [...list, effect]);
  }

  public get(actionType: string): RegisteredEffect[] {
    return this._effects.get(actionType) || [];
  }

  public has(actionType: string): boolean {
    return !!this._effects.get(actionType)?.length;
  }
}
