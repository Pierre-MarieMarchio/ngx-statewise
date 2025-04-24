import { Injectable, inject } from '@angular/core';
import { ActionDispatcher } from '../../action/action-dispatcher';
import { Action } from '../../action/action-type';
import { PendingEffectRegistry } from '../../registries/pending-effect.registery';
import { SWEffects } from '../interfaces/SWEffects.types';
import { ofType } from '../../action';
import { EffectPromiseService } from './effect-promise.service';

@Injectable({ providedIn: 'root' })
export class EffectRegistrationService {
  private readonly actionDispatcher = ActionDispatcher.getInstance();
  private readonly pendingEffectRegistry = inject(PendingEffectRegistry);
  private readonly effectPromiseService = inject(EffectPromiseService);

  public registerEffect<T extends (...args: any[]) => Action>(
    actionCreator: T,
    handler: (payload?: any) => SWEffects
  ): void {
    const actionType = ofType(actionCreator);

    this.actionDispatcher.registerHandler(
      actionType,
      async (action: Action) => {
        const effectPromise = this.effectPromiseService.createPromise(
          handler,
          action,
          actionType
        );
        this.pendingEffectRegistry.register(actionType, effectPromise);
        return effectPromise;
      }
    );
  }
}
