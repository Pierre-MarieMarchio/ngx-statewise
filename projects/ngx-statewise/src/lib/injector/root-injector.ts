import { EnvironmentInjector } from '@angular/core';

let rootInjector: EnvironmentInjector | null = null;

export function setRootInjector(injector: EnvironmentInjector): void {
  rootInjector = injector;
}

export function getRootInjector(): EnvironmentInjector {
  if (!rootInjector) {
    throw new Error(
      '[StateManager] EnvironmentInjector not initialized. Ensure that provideStateManager() is included in the providers of bootstrapApplication.'
    );
  }
  return rootInjector;
}
