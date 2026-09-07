import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PendingEffectRegistry {
  private readonly pending: Map<string, Promise<void>[]> = new Map();

  public register(actionType: string, promise: Promise<void>): Promise<void> {
    const list = this.pending.get(actionType) || [];
    this.pending.set(actionType, [...list, promise]);

    const cleanup = () => {
      const current = this.pending.get(actionType) || [];
      const remaining = current.filter((p) => p !== promise);
      if (remaining.length) {
        this.pending.set(actionType, remaining);
      } else {
        this.pending.delete(actionType);
      }
    };
    promise.then(cleanup, cleanup);

    return promise;
  }

  public get(actionType: string): Promise<void>[] {
    return this.pending.get(actionType) || [];
  }

  public async waitFor(actionType: string): Promise<void> {
    await Promise.all(this.get(actionType));
  }

  public async waitForAll(): Promise<void> {
    const all = Array.from(this.pending.values()).flat();
    await Promise.all(all);
  }
}
