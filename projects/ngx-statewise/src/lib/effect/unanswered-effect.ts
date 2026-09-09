/**
 * Raised when an effect that promised an action produced none.
 *
 * The engine cannot tell an effect deliberately finishing without an action
 * from a source that quietly ran dry — both reach it as an empty result. So
 * the effect says which one it is, and this is what the other one costs when
 * it happens.
 */
export function unansweredEffectError(actionType: string): Error {
  return new Error(
    `[ngx-statewise] The effect for "${actionType}" declares mustAnswer and ` +
      `produced no action. A one-shot source completing without emitting is ` +
      `the usual cause: nothing answers the request, so whatever its updater ` +
      `set on the way in is never cleared. End the pipeline with a fallback ` +
      `action, or drop mustAnswer if this effect may legitimately answer ` +
      `nothing.`,
  );
}
