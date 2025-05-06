import { inject, Injectable } from '@angular/core';
import { ActionEffectRegistry } from '../../../registries/global-effect.registery';
import { Action } from '../../interfaces/action-type';

@Injectable({ providedIn: 'root' })
export class ActionEffectHandlerr {
  private readonly registry = inject(ActionEffectRegistry);

  public handle(action: Action): void {
    const effects = this.registry.get(action.type);
    for (const effect of effects) {
      effect(action);
    }
  }
}
