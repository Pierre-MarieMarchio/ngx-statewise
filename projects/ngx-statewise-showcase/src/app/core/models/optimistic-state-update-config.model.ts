import { WritableSignal } from '@angular/core';

export interface OptimisticStateUpdateConfig<T> {
  sourceData: () => T[] | undefined;
  pendingUpdates: WritableSignal<Map<string, T>>;
  localData: WritableSignal<T[]>;
  getEntityId?: (item: T) => string;
  isUpdateConfirmed?: (sourceItem: T, pendingItem: T) => boolean;
  disableAutoCleanup?: boolean;
}
