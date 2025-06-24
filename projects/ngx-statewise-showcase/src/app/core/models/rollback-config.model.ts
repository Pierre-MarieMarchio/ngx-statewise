import { WritableSignal } from "@angular/core";

export interface RollbackConfig<T> {
  isError: () => boolean;
  originalData: () => T[] | undefined;
  localData: WritableSignal<T[]>;
  pendingUpdates?: WritableSignal<Map<string, T>>;
  errorMessage?: string;
}