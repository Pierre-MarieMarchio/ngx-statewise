import { Action } from '../action';
import { WritableSignal, signal, Signal, computed } from '@angular/core';

/**
 * Singleton class responsible for managing and dispatching actions
 * within a reactive effect system.
 */
export class EffectHandler {
  private static _instance: EffectHandler;

  // Use a signal to store the latest action
  private readonly _latestAction: WritableSignal<Action | null> = signal(null);

  // Store all dispatched actions (useful for debugging)
  private readonly _actionHistory: WritableSignal<Action[]> = signal([]);

  // Map of registered effect handlers by action type
  private readonly _effectHandlers: Map<string, ((action: Action) => void)[]> =
    new Map();

  /**
   * Private constructor to prevent external instantiation.
   * Use `getInstance()` to access the singleton instance.
   */
  private constructor() {}

  /**
   * Returns the singleton instance of the EffectHandler.
   *
   * @returns {EffectHandler} The global EffectHandler instance.
   */
  public static getInstance(): EffectHandler {
    if (!EffectHandler._instance) {
      EffectHandler._instance = new EffectHandler();
    }
    return EffectHandler._instance;
  }

  /**
   * Returns a signal with the latest action
   */
  public get latestAction(): Signal<Action | null> {
    return this._latestAction.asReadonly();
  }

  /**
   * Returns a signal with the action history
   */
  public get actionHistory(): Signal<Action[]> {
    return this._actionHistory.asReadonly();
  }

  /**
   * Dispatches a new action into the system.
   *
   * @param {Action} action - The action to dispatch.
   */
  public emit(action: Action): void {
    // Update the latest action signal

    console.log('in emit', action);
    

    this._latestAction.set(action);

    console.log("this._latestAction ", this._latestAction());
    

    // Add to history
    this._actionHistory.update((history) => [...history, action]);

    // Notify registered handlers for this action type
    const handlers = this._effectHandlers.get(action.type);
    if (handlers) {
      handlers.forEach((handler) => handler(action));
    }
  }

  /**
   * Registers a handler for a specific action type
   *
   * @param {string} actionType - The type of action to handle
   * @param {Function} handler - The function to call when this action type is emitted
   */
  public registerHandler(
    actionType: string,
    handler: (action: Action) => void
  ): void {
    const handlers = this._effectHandlers.get(actionType) || [];
    this._effectHandlers.set(actionType, [...handlers, handler]);
  }

  /**
   * Creates a computed signal that filters actions by type
   *
   * @template T - A subtype of Action to narrow down the type.
   * @param {string} actionType - The type of action to filter by.
   * @returns {Signal<T | null>} Signal emitting the latest action of the given type.
   */
  public ofType<T extends Action>(actionType: string): Signal<T | null> {
    return computed(() => {
      const action = this._latestAction();
      return action?.type === actionType ? (action as T) : null;
    });
  }
}