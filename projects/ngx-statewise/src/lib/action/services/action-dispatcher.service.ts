import { Injectable, inject } from '@angular/core';
import type { Action } from '../interfaces/action-type';
import { ActionHistoryService } from './action-history.service';
import { ActionEffectHandler } from './handlers/action-effect.handler';
import type { DispatchExecution } from '../../manager/interfaces/dispatch-execution';

@Injectable({ providedIn: 'root' })
export class ActionDispatcherService {
  private readonly actionHistory = inject(ActionHistoryService);
  private readonly actionEffectHandler = inject(ActionEffectHandler);

  public emit(action: Action, execution: DispatchExecution): Promise<void> {
    this.actionHistory.record(action);
    return this.actionEffectHandler.handle(action, execution);
  }
}
