import { Subject, Observable, filter } from 'rxjs';
import { Action } from '../action';

export class EffectHandler {
  private static _instance: EffectHandler;
  private readonly _actions = new Subject<Action>();

  private constructor() {}

  public static getInstance(): EffectHandler {
    if (!EffectHandler._instance) {
      EffectHandler._instance = new EffectHandler();
    }
    return EffectHandler._instance;
  }

  public get actions(): Observable<Action> {
    return this._actions.asObservable();
  }

  public emit(action: Action): void {
    console.log('Emitting action:', action.type);
    this._actions.next(action);
  }

  public ofType<T extends Action>(actionType: string): Observable<T> {
    return this.actions.pipe(
      filter((action): action is T => action.type === actionType)
    );
  }
}