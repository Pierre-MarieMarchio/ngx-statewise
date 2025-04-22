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
   * Registers a specific updator for a given action type.
   *
   * This method links an updator to a particular action type, allowing the state
   * to be updated when an action of this type is dispatched. By default, it prevents
   * overwriting existing registrations, but this behavior can be controlled through options.
   *
   * @template S - The type of state managed by the updator.
   * @param actionType - The type of action to associate with this updator.
   * @param updator - The updator object that will handle state updates for this action type.
   * @param options - Configuration options:
   *   - `overwrite`: If true, allows overwriting an existing updator registration. Default is false.
   */
  public registerUpdator<S>(
    actionType: string,
    updator: IUpdator<S>,
    options: { overwrite?: boolean } = {}
  ): void {
    if (this._updatorRegistry.has(actionType) && !options.overwrite) {
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

  /**
   * Returns all action types that have registered updators.
   *
   * This method provides a way to inspect which action types are currently
   * handled by registered updators, useful for debugging or dynamic feature detection.
   *
   * @returns An array of action type strings.
   */
  public getRegisteredActionTypes(): string[] {
    return Array.from(this._updatorRegistry.keys());
  }

  /**
   * Checks if an updator is registered for a specific action type.
   *
   * This method allows you to determine if there's already an updator
   * handling a particular action type without accessing the registry directly.
   *
   * @param actionType - The action type to check.
   * @returns Boolean indicating if an updator is registered for this action type.
   *
   */
  public hasUpdator(actionType: string): boolean {
    return this._updatorRegistry.has(actionType);
  }

  /**
   * Unregisters an updator for a specific action type.
   *
   * This method removes the association between an action type and its updator,
   * useful for cleanup or dynamic feature toggling.
   *
   * @param actionType - The action type to unregister.
   * @returns Boolean indicating if an updator was successfully removed.
   */
  public unregisterUpdator(actionType: string): boolean {
    return this._updatorRegistry.delete(actionType);
  }

  /**
   * Clears all registered updators.
   *
   * This method removes all updator registrations, providing a clean slate.
   * Useful for testing or complete application resets.
   *
   */
  public clearUpdators(): void {
    this._updatorRegistry.clear();
  }
}
