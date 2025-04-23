import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';
import { IUpdator } from '../updator/updator-interfaces';
import { UpdatorGlobalRegistry } from '../updator/updator-globalRegistery';

/**
 * Registers an array of updators globally at application startup.
 *
 * This function provides a way to register state updators during the Angular
 * application initialization phase, making them available throughout the application
 * without needing to register them with each dispatch call.
 *
 * @param updators - An array of updator objects to be registered globally.
 * @returns Angular EnvironmentProviders to be included in your application bootstrap.
 *
 */
export function provideUpdators(
  updators: IUpdator<any>[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(() => {
      const registry = UpdatorGlobalRegistry.getInstance();
      updators.forEach((updator) => registry.registerFullUpdator(updator));
    }),
  ]);
}
