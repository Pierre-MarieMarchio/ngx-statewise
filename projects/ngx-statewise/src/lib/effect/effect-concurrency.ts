/**
 * How a dispatch behaves while a run of the same effect is still in flight.
 *
 * Only the runs of one effect, in one dispatch scope, under one concurrency
 * key compete with each other. Two managers dispatching the same action never
 * supersede one another, and neither do two payloads mapped to distinct keys.
 */
export type EffectConcurrency =
  /**
   * Every run goes on side by side, and each answers when it answers. The
   * behaviour the engine has always had, and the default.
   */
  | 'parallel'
  /**
   * The newest run wins: the one in flight is abandoned, its `abortSignal`
   * fires, and its answer is dropped instead of overwriting the newer one.
   */
  | 'latest'
  /**
   * The oldest run wins: while it is in flight, a new dispatch runs no
   * handler at all. Its updater is applied all the same — the policy governs
   * effects, not state.
   */
  | 'first';

/** What an effect declaring no policy gets. */
export const DEFAULT_EFFECT_CONCURRENCY: EffectConcurrency = 'parallel';
