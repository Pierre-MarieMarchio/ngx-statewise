import { WritableSignal, signal, Signal } from '@angular/core';
import { Action } from '../action/action-type';

/**
 * Singleton class responsible for managing and dispatching actions
 * within a reactive effect system.
 *
 * - Emits actions to all registered handlers.
 * - Tracks latest emitted action and full dispatch history.
 * - Manages pending effects for synchronization purposes.
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
   * Retrieves the singleton instance of `EffectHandler`.
   *
   * @returns The global `EffectHandler` instance.
   */
  public static getInstance(): EffectHandler {
    if (!EffectHandler._instance) {
      EffectHandler._instance = new EffectHandler();
    }
    return EffectHandler._instance;
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
    console.log('in emit', action);

    this._latestAction.set(action);
    console.log('this._latestAction ', this._latestAction());

    this._actionHistory.update((history) => [...history, action]);

    const handlers = this._effectHandlers.get(action.type);
    if (handlers) {
      handlers.forEach((handler) => handler(action));
    }
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
    const handlers = this._effectHandlers.get(actionType) || [];
    this._effectHandlers.set(actionType, [...handlers, handler]);
  }

  /**
   * Tracks a pending effect promise for a given action type.
   *
   * Used to wait for completion or manage side-effects lifecycle.
   *
   * @param actionType - The related action type.
   * @param promise - The effect promise to track.
   */
  public registerPendingEffect(
    actionType: string,
    promise: Promise<void>
  ): void {
    const pendingEffects = this._pendingEffects.get(actionType) || [];
    this._pendingEffects.set(actionType, [...pendingEffects, promise]);

    promise.finally(() => {
      const currentPending = this._pendingEffects.get(actionType) || [];
      this._pendingEffects.set(
        actionType,
        currentPending.filter((p) => p !== promise)
      );
    });
  }

  /**
   * Waits for all pending effects associated with a given action type.
   *
   * @param actionType - The action type whose effects must be resolved.
   */
  public async waitForEffects(actionType: string): Promise<void> {
    const pending = this._pendingEffects.get(actionType) || [];
    await Promise.all(pending);
  }

  /**
   * Waits for all currently pending effects in the system.
   *
   * Useful for flushing side-effects or awaiting full system sync.
   */
  public async waitForAllEffects(): Promise<void> {
    const allPromises = Array.from(this._pendingEffects.values()).flat();
    await Promise.all(allPromises);
  }
}