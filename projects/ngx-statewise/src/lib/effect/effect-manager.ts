export class EffectManager {
  private static _instance: EffectManager;
  private readonly _pending: Map<string, Promise<void>[]> = new Map();
  private constructor() {}

  public static getInstance(): EffectManager {
    if (!this._instance) {
      this._instance = new EffectManager();
    }
    return this._instance;
  }

  /**
   * Registers a pending effect promise for a given action type.
   *
   * @param actionType - The related action type.
   * @param promise - The effect promise to track.
   * @returns The registered promise for chaining.
   */
  public register(actionType: string, promise: Promise<void>): Promise<void> {
    const list = this._pending.get(actionType) || [];
    this._pending.set(actionType, [...list, promise]);
    console.log('registered pending effect:', actionType);

    // Clean up the promise from the pending list when it resolves or rejects
    promise.finally(() => {
      const current = this._pending.get(actionType) || [];
      this._pending.set(
        actionType,
        current.filter((p) => p !== promise)
      );
      console.log(`effect for ${actionType} completed`);
    });

    return promise;
  }

  /**
   * Gets all currently pending promises for a specific action type.
   *
   * @param actionType - The action type to get pending promises for.
   * @returns Array of pending promises for the action type.
   */
  public getPendingPromises(actionType: string): Promise<void>[] {
    return this._pending.get(actionType) || [];
  }

  /**
   * Waits for all pending effects associated with a given action type.
   *
   * @param actionType - The action type whose effects must be resolved.
   */
  public async waitFor(actionType: string): Promise<void> {
    const pending = this._pending.get(actionType) || [];
    console.log('wait for pending:', pending);
    console.log('wait for this._pending:', this._pending);
    await Promise.all(pending);
  }

  /**
   * Waits for all currently pending effects in the system.
   */
  public async waitForAll(): Promise<void> {
    const all = Array.from(this._pending.values()).flat();
    await Promise.all(all);
  }
}
