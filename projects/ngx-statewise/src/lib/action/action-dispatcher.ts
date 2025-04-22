import { WritableSignal, Signal, signal } from '@angular/core';
import { Action } from './action-type';

export class ActionDispatcher {
  private static _instance: ActionDispatcher;

  private readonly _latestAction: WritableSignal<Action | null> = signal(null);
  private readonly _actionHistory: WritableSignal<Action[]> = signal([]);
  private readonly _handlers: Map<string, ((action: Action) => void)[]> =
    new Map();

  private constructor() {}

  /**
   * Retrieves the singleton instance of `ActionDispatcher`.
   *
   * @returns The global `ActionDispatcher` instance.
   */
  public static getInstance(): ActionDispatcher {
    if (!this._instance) {
      this._instance = new ActionDispatcher();
    }
    return this._instance;
  }

  /**
   * Signal that emits the latest dispatched action.
   *
   * Can be used for reactive bindings or subscriptions.
   */
  public get latestAction(): Signal<Action | null> {
    return this._latestAction.asReadonly();
  }

  /**
   * Signal containing the full history of all dispatched actions.
   *
   * Useful for debugging or time-travel features.
   */
  public get actionHistory(): Signal<Action[]> {
    return this._actionHistory.asReadonly();
  }

  /**
   * Dispatches an action to all registered handlers.
   *
   * - Updates `latestAction` and `actionHistory`.
   * - Notifies all handlers associated with the action type.
   *
   * @param action - The action to dispatch.
   */
  public emit(action: Action): void {
    this._latestAction.set(action);
    this._actionHistory.update((history) => [...history, action]);
    this._handlers.get(action.type)?.forEach((handler) => handler(action));
  }

  /**
   * Registers a handler for a specific action type.
   *
   * The handler will be called every time an action of this type is emitted.
   *
   * @param actionType - The action type to listen for.
   * @param handler - The function to call when the action is dispatched.
   */
  public registerHandler(
    actionType: string,
    handler: (action: Action) => void
  ): void {
    const list = this._handlers.get(actionType) || [];
    this._handlers.set(actionType, [...list, handler]);
  }
}
