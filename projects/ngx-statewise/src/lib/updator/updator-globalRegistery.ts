import { IUpdator } from './updator-interfaces';

export class UpdatorGlobalRegistry {
  private static _instance: UpdatorGlobalRegistry;

  private readonly _updatorRegistry: Map<string, IUpdator<any>> = new Map();

  private constructor() {}

  public static getInstance(): UpdatorGlobalRegistry {
    if (!UpdatorGlobalRegistry._instance) {
      UpdatorGlobalRegistry._instance = new UpdatorGlobalRegistry();
    }
    return UpdatorGlobalRegistry._instance;
  }

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
