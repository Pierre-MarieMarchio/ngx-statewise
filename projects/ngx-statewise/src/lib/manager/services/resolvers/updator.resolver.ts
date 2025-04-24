import { inject, Injectable } from '@angular/core';
import { ActionContextRegistery } from '../../../registries/action-context.registery';
import { GlobalUpdatorsRegistry } from '../../../registries/global-updators.registery';
import { LocalUpdatorRegistry } from '../../../registries/local-updators.registery';
import { IUpdator } from '../../../updator';

@Injectable({ providedIn: 'root' })
export class UpdatorResolver {
  private readonly globalUpdatorsRegistry = inject(GlobalUpdatorsRegistry);
  private readonly localUpdatorsRegistry = inject(LocalUpdatorRegistry);
  private readonly actionContext = inject(ActionContextRegistery);

  resolveUpdator<S>(
    actionType: string,
    contextOrUpdator?: object | IUpdator<S>
  ): IUpdator<S> | undefined {
    this.setContext(actionType, contextOrUpdator);

    const explicit = this.asUpdator(contextOrUpdator);
    if (explicit) {
      this.localUpdatorsRegistry.register(explicit, explicit);
      return explicit;
    }

    const local = this.asLocal(contextOrUpdator, actionType);
    if (local) {
      return local;
    }

    return this.globalUpdatorsRegistry.getUpdator<S>(actionType);
  }

  private setContext(type: string, context?: object | IUpdator<any>) {
    if (context) this.actionContext.set(type, context);
  }

  private asUpdator<S>(updator?: object | IUpdator<S>): IUpdator<S> | null {
    return updator && 'state' in updator && 'updators' in updator
      ? updator
      : null;
  }

  private asLocal<S>(
    context: object | IUpdator<S> | undefined,
    type: string
  ): IUpdator<S> | null {
    return context && !this.asUpdator(context)
      ? this.localUpdatorsRegistry.get(context as object, type) ?? null
      : null;
  }
}
