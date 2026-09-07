import { emptyPayload, payload } from './payload';

describe('payload declarations', () => {
  it('declares an action without data', () => {
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- asserting on the returned value is the point of this test
    const declared = emptyPayload();

    expect(declared).toBeUndefined();
  });

  it('declares a payload by handing its value back untouched', () => {
    const value = { id: 42 };

    expect(payload<{ id: number }>()(value)).toBe(value);
    expect(payload<number>()(7)).toBe(7);
  });
});
