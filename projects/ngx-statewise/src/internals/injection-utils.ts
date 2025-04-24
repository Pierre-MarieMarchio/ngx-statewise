import { runInInjectionContext } from "@angular/core";
import { getRootInjector } from "./root-injector";

export async function withInjectionContext<T>(
  fn: () => Promise<T> | T
): Promise<T> {
  return runInInjectionContext(getRootInjector(), fn);
}
