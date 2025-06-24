import { effect, Injectable, WritableSignal } from "@angular/core";
import { OptimisticStateUpdateConfig } from "../models";

@Injectable({
  providedIn: 'root',
})
export class OptimisticStateUpdateService {

  public setupOptimisticUpdates<T>(
    config: OptimisticStateUpdateConfig<T>
  ): () => void {
    const getEntityId = config.getEntityId || ((item: any) => item.id);
    const isUpdateConfirmed =
      config.isUpdateConfirmed ||
      ((sourceItem: T, pendingItem: T) =>
        JSON.stringify(sourceItem) === JSON.stringify(pendingItem));

    const optimisticEffect = effect(() => {
      const sourceData = config.sourceData();
      const pending = config.pendingUpdates();

      if (!sourceData) {
        return;
      }

      const mergedData = sourceData.map((item) => {
        const entityId = getEntityId(item);
        return pending.has(entityId) ? pending.get(entityId)! : item;
      });

      config.localData.set([...mergedData]);

      if (!config.disableAutoCleanup && pending.size > 0) {
        const newPending = new Map(pending);
        let hasCleanupChanges = false;

        pending.forEach((pendingItem, entityId) => {
          const sourceItem = sourceData.find(
            (item) => getEntityId(item) === entityId
          );
          if (sourceItem && isUpdateConfirmed(sourceItem, pendingItem)) {
            newPending.delete(entityId);
            hasCleanupChanges = true;
          }
        });

        if (hasCleanupChanges) {
          config.pendingUpdates.set(newPending);
        }
      }
    });

    return () => optimisticEffect.destroy();
  }

  public addOptimisticUpdate<T>(
    pendingUpdates: WritableSignal<Map<string, T>>,
    item: T,
    getEntityId: (item: T) => string = (item: any) => item.id
  ): void {
    const current = pendingUpdates();
    const entityId = getEntityId(item);
    current.set(entityId, item);
    pendingUpdates.set(new Map(current));
  }

  public removeOptimisticUpdate<T>(
    pendingUpdates: WritableSignal<Map<string, T>>,
    entityId: string
  ): void {
    const current = pendingUpdates();
    if (current.has(entityId)) {
      current.delete(entityId);
      pendingUpdates.set(new Map(current));
    }
  }

  public clearOptimisticUpdates<T>(
    pendingUpdates: WritableSignal<Map<string, T>>
  ): void {
    pendingUpdates.set(new Map());
  }
}
