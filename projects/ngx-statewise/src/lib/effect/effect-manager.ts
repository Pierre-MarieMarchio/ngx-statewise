export class EffectManager {
  private static _instance: EffectManager;

  private readonly _pending: Map<string, Promise<void>[]> = new Map();

  private constructor() {}

  /**
   * Retrieves the singleton instance of `EffectManager`.
   *
   * @returns The global `EffectManager` instance.
   */
  public static getInstance(): EffectManager {
    if (!this._instance) {
      this._instance = new EffectManager();
    }
    return this._instance;
  }

  /**
   * Registers a pending effect promise for a given action type.
   *
   * Used to wait for completion or manage side-effects lifecycle.
   *
   * @param actionType - The related action type.
   * @param promise - The effect promise to track.
   */
  public register(actionType: string, promise: Promise<void>): void {
    const list = this._pending.get(actionType) || [];
    this._pending.set(actionType, [...list, promise]);

    promise.finally(() => {
      const current = this._pending.get(actionType) || [];
      this._pending.set(
        actionType,
        current.filter((p) => p !== promise)
      );
    });
  }

  /**
   * Waits for all pending effects associated with a given action type.
   *
   * @param actionType - The action type whose effects must be resolved.
   */
  public async waitFor(actionType: string): Promise<void> {
    const pending = this._pending.get(actionType) || [];
    await Promise.all(pending);
  }

  /**
   * Waits for all currently pending effects in the system.
   *
   * Useful for flushing side-effects or awaiting full system sync.
   */
  public async waitForAll(): Promise<void> {
    const all = Array.from(this._pending.values()).flat();
    await Promise.all(all);
  }
}
