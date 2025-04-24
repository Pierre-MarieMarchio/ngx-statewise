import { Injectable, signal, Signal } from '@angular/core';
import { Action } from '../interfaces/action-type';

@Injectable({ providedIn: 'root' })
export class ActionHistoryService {
  private readonly _latest = signal<Action | null>(null);
  private readonly _history = signal<Action[]>([]);

  public latest(): Signal<Action | null> {
    return this._latest.asReadonly();
  }

  public history(): Signal<Action[]> {
    return this._history.asReadonly();
  }

  public record(action: Action): void {
    this._latest.set(action);
    this._history.update((list) => [...list, action]);
  }
}
