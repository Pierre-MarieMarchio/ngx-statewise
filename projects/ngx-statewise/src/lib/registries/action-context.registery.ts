import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActionContextRegistery{
  private readonly contextMap = new Map<string, object>();

  public set(actionType: string, context: object): void {
    this.contextMap.set(actionType, context);
  }

  public get(actionType: string): object | undefined {
    return this.contextMap.get(actionType);
  }

  public clear(actionType: string): void {
    this.contextMap.delete(actionType);
  }
}
