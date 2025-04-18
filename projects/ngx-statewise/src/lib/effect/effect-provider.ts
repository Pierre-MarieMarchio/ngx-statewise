import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  Type,
} from '@angular/core';

/**
 * Registers and instantiates a list of effect classes at application startup.
 *
 * @param effectClasses - Array of effect class types to initialize.
 * @returns EnvironmentProviders to include in your application bootstrap.
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
