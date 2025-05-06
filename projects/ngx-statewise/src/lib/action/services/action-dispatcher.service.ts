import { Injectable, inject } from '@angular/core';
import { ActionEffectRegistry } from '../../registries/global-effect.registery';
import { PendingEffectRegistry } from '../../registries/pending-effect.registery';
import { Action } from '../interfaces/action-type';
import { ActionHistoryService } from './action-history.service';
import { ActionEffectHandlerr } from './handlers/action-effect.handler';

@Injectable({ providedIn: 'root' })
export class ActionDispatcherService {
  private readonly actionHistory = inject(ActionHistoryService);
  private readonly actionEffectHandler = inject(ActionEffectHandlerr);
  private readonly globalEffectRegistery = inject(ActionEffectRegistry);
  private readonly pendingEffectRegistry = inject(PendingEffectRegistry);

  public emit(action: Action): void {
    if (!this.globalEffectRegistery.has(action.type)) {
      this.pendingEffectRegistry.register(action.type, Promise.resolve());
    }

    this.actionHistory.record(action);
    this.actionEffectHandler.handle(action);
  }
}
