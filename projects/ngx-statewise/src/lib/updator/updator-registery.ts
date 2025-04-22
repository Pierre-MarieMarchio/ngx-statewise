import { IUpdator } from './updator-interfaces';


/**
 * Singleton class responsible for managing and retrieving `IUpdator` instances
 * associated with specific action types.
 *
 * - Register a `IUpdator` that handles multiple action types
 * - Retrieve a registered `IUpdator` by its associated action type
 */
export class UpdatorRegistry {
  private static _instance: UpdatorRegistry;

  private readonly _updatorRegistry: Map<string, IUpdator<any>> = new Map();

  private constructor() {}

  /**
   * Retrieves the singleton instance of `EffectHandler`.
   *
   * @returns The global `UpdatorRegistry` instance.
   */
  public static getInstance(): UpdatorRegistry {
    if (!UpdatorRegistry._instance) {
      UpdatorRegistry._instance = new UpdatorRegistry();
    }
    return UpdatorRegistry._instance;
  }

  /**
   * Registers a specific `updator` for a given action type.
   *
   * This function links an `IUpdator` to a particular action type, allowing
   * the state to be updated when the action is dispatched.
   *
   * @template S - The type of the state managed by the updator.
   * @param actionType - The type of the action to associate with the updator.
   * @param updator - The `IUpdator` that will update the state for the given action type.
   */
  public registerUpdator<S>(actionType: string, updator: IUpdator<S>): void {
    if (this._updatorRegistry.has(actionType)) {
      return;
    }
    this._updatorRegistry.set(actionType, updator);
  }

  /**
   * Registers an `updator` for all the action types it handles.
   *
   * This function registers the `IUpdator` for each action type contained
   * in its `updators` registry. It is useful when a single `IUpdator`
   * handles multiple action types.
   *
   * @template S - The type of the state managed by the updator.
   * @param updator - The `IUpdator` to register for multiple action types.
   */
  public registerFullUpdator<S>(updator: IUpdator<S>): void {
    Object.keys(updator.updators).forEach((actionType) => {
      this.registerUpdator(actionType, updator);
    });
  }

  /**
   * Retrieves the `updator` associated with a given action type.
   *
   * This function looks up the `IUpdator` that is responsible for managing
   * state updates when an action of the specified type is dispatched.
   *
   * @template S - The type of the state managed by the updator.
   * @param actionType - The type of the action for which the updator is registered.
   * @returns The `IUpdator` associated with the action type, or `undefined` if none is found.
   */
  public getUpdator<S>(actionType: string): IUpdator<S> | undefined {
    return this._updatorRegistry.get(actionType);
  }
}
