import { inject, Injectable } from '@angular/core';
import { IUpdator } from '../interfaces/updator.interfaces';
import { withInjectionContext } from '../../../internal/injection-utils';

@Injectable({ providedIn: 'root' })
export class LocalUpdatorRegistry {
  private readonly localRegistries = new WeakMap<object, Set<IUpdator<any>>>();

  public register<S>(manager: object, updator: IUpdator<S>): void {
    if (!this.localRegistries.has(manager)) {
      this.localRegistries.set(manager, new Set());
    }

    const localRegistry = this.localRegistries.get(manager)!;
    localRegistry.add(updator);
  }

  public get<S>(manager: object, actionType: string): IUpdator<S> | undefined {
    const localRegistry = this.localRegistries.get(manager);
    if (!localRegistry) return undefined;

    for (const updator of localRegistry) {
      if (updator.updators[actionType]) {
        return updator as IUpdator<S>;
      }
    }

    return undefined;
  }
}

export function registerLocalUpdator<S>(manager: object, updator: IUpdator<S>) {
  withInjectionContext(() => {
    const localUpdatorRegistry = inject(LocalUpdatorRegistry);
    localUpdatorRegistry.register(manager, updator);
  });
}
