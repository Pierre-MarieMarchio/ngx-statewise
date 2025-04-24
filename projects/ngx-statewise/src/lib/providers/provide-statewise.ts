import {
  EnvironmentInjector,
  inject,
  provideEnvironmentInitializer,
} from '@angular/core';
import { setRootInjector } from '../injector/root-injector';

export function provideStatewise() {
  return provideEnvironmentInitializer(() => {
    const injector = inject(EnvironmentInjector);
    setRootInjector(injector);
  });
}
