import {
  defineActionsGroup,
  emptyPayload,
  ofType,
  payload,
} from 'ngx-statewise';

/**
 * The action helpers, and nothing else — the shape someone asks for when they
 * want `defineActionsGroup` without an engine.
 *
 * No `provideStatewise`, no updater, no effect, no dispatch handle. If the
 * package tree-shook, this variant would weigh a fraction of the full one.
 */
const sizingActions = defineActionsGroup({
  source: 'SIZING',
  events: {
    pinged: payload<number>(),
    reset: emptyPayload,
  },
});

export function subject(): string {
  const pinged = sizingActions.pinged(1);
  const reset = sizingActions.reset();

  return [
    ofType(sizingActions.pinged),
    String(pinged.payload),
    ofType(sizingActions.reset),
    reset.type,
  ].join(' ');
}
