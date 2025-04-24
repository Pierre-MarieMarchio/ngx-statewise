import { Injectable } from '@angular/core';
import { IUpdator } from '../updator/interfaces/updator.interfaces';

@Injectable({ providedIn: 'root' })
export class GlobalUpdatorsRegistry {
  private readonly _updatorRegistry: Map<string, IUpdator<any>> = new Map();

  private constructor() {}

  public registerUpdator<S>(actionType: string, updator: IUpdator<S>): void {
    if (this._updatorRegistry.has(actionType)) {
      return;
    }
    this._updatorRegistry.set(actionType, updator);
  }

  public registerFullUpdator<S>(updator: IUpdator<S>): void {
    Object.keys(updator.updators).forEach((actionType) => {
      this.registerUpdator(actionType, updator);
    });
  }

  public getUpdator<S>(actionType: string): IUpdator<S> | undefined {
    return this._updatorRegistry.get(actionType);
  }

  public getRegisteredActionTypes(): string[] {
    return Array.from(this._updatorRegistry.keys());
  }

  public hasUpdator(actionType: string): boolean {
    return this._updatorRegistry.has(actionType);
  }

  public unregisterUpdator(actionType: string): boolean {
    return this._updatorRegistry.delete(actionType);
  }

  public clearUpdators(): void {
    this._updatorRegistry.clear();
  }
}
