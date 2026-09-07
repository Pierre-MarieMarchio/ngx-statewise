import { inject, Injectable } from '@angular/core';
import { ActionEffectRegistry } from '../../../registries/global-effect.registery';
import type { Action } from '../../interfaces/action-type';
import type { DispatchExecution } from '../../../manager/interfaces/dispatch-execution';

@Injectable({ providedIn: 'root' })
export class ActionEffectHandler {
  private readonly registry = inject(ActionEffectRegistry);

  public async handle(
    action: Action,
    execution: DispatchExecution
  ): Promise<void> {
    const effects = this.registry.get(action.type);
    await Promise.all(effects.map((effect) => effect(action, execution)));
  }
}
