export class EffectManager {
  private static _instance: EffectManager;
  private readonly _pending: Map<string, Promise<void>[]> = new Map();
  private readonly _actionRelations: Map<string, Set<string>> = new Map();
  private constructor() {}

  public static getInstance(): EffectManager {
    if (!this._instance) {
      this._instance = new EffectManager();
    }
    return this._instance;
  }

  /**
   * Enregistre une relation parent-enfant entre deux actions
   * Quand parentActionType déclenche childActionType
   */
  public registerActionRelation(
    parentActionType: string,
    childActionType: string
  ): void {
    if (!this._actionRelations.has(parentActionType)) {
      this._actionRelations.set(parentActionType, new Set());
    }
    this._actionRelations.get(parentActionType)?.add(childActionType);
  }

  /**
   * Récupère récursivement tous les types d'actions enfants d'une action donnée
   */
  private getAllRelatedActionTypes(
    actionType: string,
    visited = new Set<string>()
  ): Set<string> {
    if (visited.has(actionType)) {
      return visited; // Éviter les boucles infinies
    }

    visited.add(actionType);
    const children = this._actionRelations.get(actionType) || new Set<string>();

    for (const childType of children) {
      this.getAllRelatedActionTypes(childType, visited);
    }

    return visited;
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
    // Récupérer tous les types d'actions liés (incluant l'action elle-même)
    const allRelatedTypes = this.getAllRelatedActionTypes(actionType);
    console.log(
      `Waiting for actions: ${Array.from(allRelatedTypes).join(', ')}`
    );

    // Collecter toutes les promesses pour tous les types d'actions liés
    const allPromisesToWait: Promise<void>[] = [];
    for (const type of allRelatedTypes) {
      const promises = this._pending.get(type) || [];
      allPromisesToWait.push(...promises);
    }

    // Attendre toutes les promesses
    console.log(`Total promises to wait: ${allPromisesToWait.length}`);
    await Promise.all(allPromisesToWait);

    console.log('promises resolved');
    
  }

  /**
   * Waits for all currently pending effects in the system.
   */
  public async waitForAll(): Promise<void> {
    const all = Array.from(this._pending.values()).flat();
    await Promise.all(all);
  }
}
