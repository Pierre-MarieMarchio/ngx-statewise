/**
 * What a run of an effect knows about itself. The handler receives it as its
 * last parameter, after the action payload when there is one.
 */
export interface EffectContext {
  /**
   * Aborted when this run is superseded by a newer one, or cancelled through
   * `cancelOn`. Hand it to whatever accepts one — `fetch`, an abort-aware
   * client — so the work actually stops instead of merely being ignored.
   *
   * Named in full rather than `signal`, deliberately: in a signals-first
   * library, an unqualified `signal` reads as an Angular one.
   */
  readonly abortSignal: AbortSignal;
}
