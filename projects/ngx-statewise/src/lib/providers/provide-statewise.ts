import { EnvironmentInjector, inject, provideEnvironmentInitializer } from "@angular/core";
import { setRootInjector } from "../../internal/root-injector";

export function provideStatewise() {
  return provideEnvironmentInitializer(() => {
    const injector = inject(EnvironmentInjector);
    setRootInjector(injector);
  });
}