import { Injectable } from '@angular/core';

import type { RegisteredInterceptor } from './registered-interceptor';

const NO_INTERCEPTORS: readonly RegisteredInterceptor[] = [];

/**
 * Holds the registered interceptors under the action type they guard.
 *
 * Registration order is preserved, because it is the order they are asked in
 * and the engine stops at the first refusal.
 */
@Injectable()
export class InterceptorRegistry {
  private readonly guards = new Map<string, readonly RegisteredInterceptor[]>();

  public register(
    actionType: string,
    interceptor: RegisteredInterceptor,
  ): void {
    this.guards.set(actionType, [
      ...(this.guards.get(actionType) ?? NO_INTERCEPTORS),
      interceptor,
    ]);
  }

  /** Drops one registration, so an interceptor dies with its injector. */
  public unregister(
    actionType: string,
    interceptor: RegisteredInterceptor,
  ): void {
    const remaining = (this.guards.get(actionType) ?? NO_INTERCEPTORS).filter(
      (registered) => registered !== interceptor,
    );

    if (remaining.length === 0) {
      this.guards.delete(actionType);
      return;
    }

    this.guards.set(actionType, remaining);
  }

  /** The interceptors a dispatch of this action type must get through. */
  public guarding(actionType: string): readonly RegisteredInterceptor[] {
    return this.guards.get(actionType) ?? NO_INTERCEPTORS;
  }
}
