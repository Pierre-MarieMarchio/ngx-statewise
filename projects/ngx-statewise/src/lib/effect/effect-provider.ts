import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  Type,
} from '@angular/core';

/**
 * Registers and instantiates a set of effect classes at application startup.
 *
 * @param effectClasses - An array of class types to be instantiated during app initialization
 * @returns An EnvironmentProviders object that can be added to the application configuration
 */
export function provideEffects(
  effectClasses: Type<any>[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...effectClasses.map((effectClass) => ({
      provide: effectClass,
      useClass: effectClass,
    })),
    provideEnvironmentInitializer(() => {
      effectClasses.forEach((effectClass) => inject(effectClass));
    }),
  ]);
}

