import type { Action } from '../action';

/**
 * What an interceptor answers about an action.
 *
 * `void` rather than `undefined`, deliberately: a handler with no return
 * statement has return type `void`, and `void` is not assignable to
 * `undefined`. Narrowing this would reject every interceptor that only wants
 * to look at what passes.
 *
 * Kept out of the public barrel: it names the answer of a handler, and the
 * handler type is what a consumer writes against.
 */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type InterceptorVerdict = boolean | void;

/**
 * An interceptor as the registry stores it: the handler already bound to its
 * payload read.
 *
 * An interceptor has no policy beside it, unlike a `RegisteredEffect`. It
 * starts no run, so there is nothing to govern: no concurrency, no
 * cancellation, no key, no promise to answer.
 */
export interface RegisteredInterceptor {
  /**
   * Asks this interceptor about a dispatched action. Only `false` refuses;
   * returning nothing lets the action through, so an interceptor that merely
   * observes needs no return statement.
   */
  readonly ask: (action: Action) => InterceptorVerdict;
}
