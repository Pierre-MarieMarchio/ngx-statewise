import { Injectable, inject } from '@angular/core';
import { withInjectionContext } from '../../../internal/injection-utils';
import { LocalUpdatorRegistry } from '../../registries/local-updators.registery';
import { IUpdator } from '../interfaces/updator.interfaces';

@Injectable({ providedIn: 'root' })
export class UpdatorRegistrationService {
  private readonly localRegistry = inject(LocalUpdatorRegistry);

  public registerLocalUpdator<S>(manager: object, updator: IUpdator<S>): void {
    this.localRegistry.register(manager, updator);
  }
}


/**
 * Registers a local updater for a given manager context.
 * 
 * This function should be used within an Angular injection context (e.g. during component initialization).
 * 
 * @template S - The state type handled by the updater.
 * @param {object} manager - The local context object (e.g., a component or a service) to associate the updater with.
 * @param {IUpdator<S>} updator - The updater instance defining actions and their update logic for the given state.
 */
export function registerLocalUpdator<S>(manager: object, updator: IUpdator<S>) {
  withInjectionContext(() => {
    const updatorRegistrationService = inject(UpdatorRegistrationService);
    updatorRegistrationService.registerLocalUpdator(manager, updator);
  });
}
