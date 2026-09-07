import { runInInjectionContext } from '@angular/core';
import { getRootInjector } from './root-injector';

export function withInjectionContext<T>(fn: () => T): T {
  return runInInjectionContext(getRootInjector(), fn);
}
