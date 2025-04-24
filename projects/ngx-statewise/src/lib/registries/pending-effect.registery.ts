import { inject, Injectable } from '@angular/core';
import { EffectRelationRegistery } from './effect-relation.registery';

@Injectable({ providedIn: 'root' })
export class PendingEffectRegistry {
  private readonly pending: Map<string, Promise<void>[]> = new Map();
  private readonly effectRelationRegistery = inject(EffectRelationRegistery);

  public register(actionType: string, promise: Promise<void>): Promise<void> {
    const list = this.pending.get(actionType) || [];
    this.pending.set(actionType, [...list, promise]);

    promise.finally(() => {
      const current = this.pending.get(actionType) || [];
      this.pending.set(
        actionType,
        current.filter((p) => p !== promise)
      );
    });

    return promise;
  }

  public getPending(actionType: string): Promise<void>[] {
    return this.pending.get(actionType) || [];
  }

  public async waitFor(actionType: string): Promise<void> {
    const allRelatedTypes =
      this.effectRelationRegistery.getAllRelated(actionType);
    const allPromisesToWait: Promise<void>[] = [];
    for (const type of allRelatedTypes) {
      const promises = this.pending.get(type) || [];
      allPromisesToWait.push(...promises);
    }
    await Promise.all(allPromisesToWait);
  }

  public async waitForAll(): Promise<void> {
    const all = Array.from(this.pending.values()).flat();
    await Promise.all(all);
  }
}
