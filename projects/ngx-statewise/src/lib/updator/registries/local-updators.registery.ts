import { inject, Injectable } from '@angular/core';
import { IUpdator } from '../interfaces/updator.interfaces';
import { withInjectionContext } from '../../../internal/injection-utils';

@Injectable({ providedIn: 'root' })
export class LocalUpdatorRegistry {
  private readonly localRegistries = new WeakMap<object, Set<IUpdator<any>>>();

  /**
   * Enregistre un updator local pour un manager donné
   * @param manager - L'objet qui gère l'updator
   * @param updator - L'updator à enregistrer
   */
  public registerLocalUpdator<S>(manager: object, updator: IUpdator<S>): void {
    if (!this.localRegistries.has(manager)) {
      this.localRegistries.set(manager, new Set());
    }

    const localRegistry = this.localRegistries.get(manager)!;
    localRegistry.add(updator);
  }

  /**
   * Récupère l'updator local associé à un type d'action pour un manager donné
   * @param manager - L'objet qui gère l'updator
   * @param actionType - Le type d'action pour lequel on cherche l'updator
   * @returns L'updator correspondant ou `undefined` s'il n'existe pas
   */
  public getLocalUpdator<S>(
    manager: object,
    actionType: string
  ): IUpdator<S> | undefined {
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
    localUpdatorRegistry.registerLocalUpdator(manager, updator);
  });
}
