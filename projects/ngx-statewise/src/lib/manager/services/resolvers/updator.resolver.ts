import { inject, Injectable } from '@angular/core';
import { GlobalUpdatorsRegistry } from '../../../registries/global-updators.registery';
import { LocalUpdatorRegistry } from '../../../registries/local-updators.registery';
import { IUpdator } from '../../../updator';

@Injectable({ providedIn: 'root' })
export class UpdatorResolver {
  private readonly globalUpdatorsRegistry = inject(GlobalUpdatorsRegistry);
  private readonly localUpdatorsRegistry = inject(LocalUpdatorRegistry);

  public resolveRoot<S>(
    actionType: string,
    contextOrUpdator?: object | IUpdator<S>
  ): IUpdator<S> | undefined {
    const explicit = this.asUpdator(contextOrUpdator);
    if (explicit) {
      return explicit;
    }

    return this.resolveScoped(actionType, contextOrUpdator);
  }

  public resolveContinuation<S>(
    actionType: string,
    contextOrUpdator?: object | IUpdator<S>
  ): IUpdator<S> | undefined {
    const explicit = this.asUpdator(contextOrUpdator);
    if (explicit?.updators[actionType]) {
      return explicit;
    }

    return this.resolveScoped(actionType, contextOrUpdator);
  }

  private resolveScoped<S>(
    actionType: string,
    contextOrUpdator?: object | IUpdator<S>
  ): IUpdator<S> | undefined {
    const context = this.asUpdator(contextOrUpdator)
      ? undefined
      : contextOrUpdator;

    const local = this.asLocal<S>(context, actionType);
    if (local) {
      return local;
    }

    return this.globalUpdatorsRegistry.getUpdator<S>(actionType);
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
