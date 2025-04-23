/**
 * Interface representing an updator for state management.
 *
 * The `IUpdator` holds the current state and a registry of functions
 * (updators) that can modify that state based on different action types.
 *
 * @template S - The type of the state.
 */
export interface IUpdator<S> {
  /**
   * The current state that the updators will modify.
   */
  readonly state: S;

  /**
   * A registry of updators, where each action type is associated with a function
   * that modifies the state.
   */
  readonly updators: UpdatorGlobalRegistry<S>;
}

/**
 * Type representing a function that updates the state based on an action.
 *
 * @template S - The type of the state.
 * @template P - The type of the payload (optional).
 *
 * @param state - The current state to be updated.
 * @param payload - The data to modify the state (optional).
 */
export type Updator<S, P = any> = (state: S, payload?: P) => void;

/**
 * A registry of updators, where each action type is mapped to an `Updator` function.
 *
 * The key is the action type (usually a string), and the value is the corresponding
 * function that modifies the state when the action is dispatched.
 *
 * @template S - The type of the state.
 */
export interface UpdatorGlobalRegistry<S> {
  /**
   * Maps action types to their corresponding `Updator` function.
   *
   * The key is an action type, and the value is an `Updator` that modifies the state.
   */
  [actionType: string]: Updator<S>;
}
