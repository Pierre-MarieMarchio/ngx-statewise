import { Subject, Observable, filter } from 'rxjs';
import { Action } from '../action';

/**
 * Singleton class responsible for managing and dispatching actions
 * within a reactive effect system.
 */
export class EffectHandler {
  private static _instance: EffectHandler;
  private readonly _actions = new Subject<Action>();

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
   * Returns an observable stream of all dispatched actions.
   *
   * @returns {Observable<Action>} Observable emitting all actions.
   */
  public get actions(): Observable<Action> {
    return this._actions.asObservable();
  }

  /**
   * Dispatches a new action into the system.
   *
   * @param {Action} action - The action to dispatch.
   */
  public emit(action: Action): void {
    console.log('Emitting action:', action.type);
    this._actions.next(action);
  }

  /**
   * Returns an observable that emits only actions matching the specified type.
   *
   * @template T - A subtype of Action to narrow down the type.
   * @param {string} actionType - The type of action to filter by.
   * @returns {Observable<T>} Observable emitting actions of the given type.
   */
  public ofType<T extends Action>(actionType: string): Observable<T> {
    return this.actions.pipe(
      filter((action): action is T => action.type === actionType)
    );
  }
}