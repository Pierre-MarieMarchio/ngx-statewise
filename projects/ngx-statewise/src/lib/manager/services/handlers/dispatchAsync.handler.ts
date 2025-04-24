import { inject, Injectable } from '@angular/core';

import { ActionContextRegistery } from '../../../registries/action-context.registery';
import { PendingEffectRegistry } from '../../../registries/pending-effect.registery';
import { CoordinatorService } from '../coordinator.service';
import { UpdatorResolver } from '../resolvers/updator.resolver';
import { Action } from '../../../action/interfaces/action-type';
import { IUpdator } from '../../../updator';
import { ActionDispatcherService } from '../../../action/services/action-dispatcher.service';

@Injectable({ providedIn: 'root' })
export class DispatchAsyncHandler {
  private readonly coordinator = inject(CoordinatorService);
  private readonly actionDispatcher =  inject(ActionDispatcherService);
  private readonly pendingEffect = inject(PendingEffectRegistry);
  private readonly actionContext = inject(ActionContextRegistery);
  private readonly updatorResolver = inject(UpdatorResolver);

  public handle<T extends Action, S>(
    action: T,
    contextOrUpdator?: object | IUpdator<S>
  ): Promise<void> {
    const updator = this.updatorResolver.resolveUpdator(
      action.type,
      contextOrUpdator
    );

    if (updator) {
      return this.execWithCleanup(
        this.coordinator.dispatchAsync(action, updator),
        action.type
      );
    }

    this.actionDispatcher.emit(action);
    return this.execWithCleanup(
      this.pendingEffect.waitFor(action.type),
      action.type
    );
  }

  private async execWithCleanup(
    promise: Promise<void>,
    type: string
  ): Promise<void> {
    try {
      return await promise;
    } finally {
      this.actionContext.clear(type);
    }
  }
}
