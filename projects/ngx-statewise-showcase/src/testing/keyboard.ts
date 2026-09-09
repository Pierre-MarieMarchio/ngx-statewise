/**
 * A keydown the component under test will actually read.
 *
 * Angular's `(keydown.enter)` reads `event.key`, while Angular Material still
 * reads the deprecated `event.keyCode` — `MatChipAction._handleKeydown` among
 * them. A `KeyboardEvent` built from an init object leaves `keyCode` at 0, so
 * a spec that only sets `key` silently exercises nothing on the Material side.
 */
const KEY_CODES: Readonly<Record<string, number>> = {
  Enter: 13,
  ' ': 32,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
};

export function pressKey(target: EventTarget, key: string): void {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });

  Object.defineProperty(event, 'keyCode', { get: () => KEY_CODES[key] ?? 0 });

  target.dispatchEvent(event);
}
