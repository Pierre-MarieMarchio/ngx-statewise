import { WritableSignal, signal, Signal } from '@angular/core';
import { Action } from '../action/action-type';

/**
 * Singleton class responsible for managing and dispatching actions
 * within a reactive effect system.
 */
export class EffectHandler {
  private static _instance: EffectHandler;

  private readonly _latestAction: WritableSignal<Action | null> = signal(null);
  private readonly _actionHistory: WritableSignal<Action[]> = signal([]);
  private readonly _effectHandlers: Map<string, ((action: Action) => void)[]> =
    new Map();
  private readonly _pendingEffects: Map<string, Promise<void>[]> = new Map();

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

    console.log('this._latestAction ', this._latestAction());

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



  public registerPendingEffect(
    actionType: string,
    promise: Promise<void>
  ): void {
    const pendingEffects = this._pendingEffects.get(actionType) || [];
    this._pendingEffects.set(actionType, [...pendingEffects, promise]);

    // Nettoyage une fois terminé
    promise.finally(() => {
      const currentPending = this._pendingEffects.get(actionType) || [];
      this._pendingEffects.set(
        actionType,
        currentPending.filter((p) => p !== promise)
      );
    });
  }

  public async waitForEffects(actionType: string): Promise<void> {
    const pending = this._pendingEffects.get(actionType) || [];
    await Promise.all(pending);
  }

  public async waitForAllEffects(): Promise<void> {
    const allPromises = Array.from(this._pendingEffects.values()).flat();
    await Promise.all(allPromises);
  }
}
