import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  Type,
} from '@angular/core';
import { IUpdator } from '../updator/interfaces/updator.interfaces';
import { GlobalUpdatorsRegistry } from '../registries/global-updators.registery';

/**
 * Registers an array of updators globally at application startup.
 *
 * This function provides a way to register state updators during the Angular
 * application initialization phase, making them available throughout the application
 * without needing to register them with each dispatch call.
 *
 * @param updators - An array of Updator class to be registered globally.
 * @returns Angular EnvironmentProviders to be included in your application bootstrap.
 *
 */
export function provideUpdators(
  updatorClasses: Type<IUpdator<any>>[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...updatorClasses, // ensure classes are registered as providers
    provideAppInitializer(() => {
      const registry = inject(GlobalUpdatorsRegistry);
      updatorClasses.forEach((cls) => {
        const instance = inject(cls);
        registry.registerFullUpdator(instance);
      });
    }),
  ]);
}
