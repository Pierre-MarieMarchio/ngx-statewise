import { effect, Injectable } from '@angular/core';
import { RollbackConfig } from '../models';

@Injectable({
  providedIn: 'root',
})
export class StateRollbackService {
  /**
   * Sets up automatic error rollback for state management.
   *
   * Creates a reactive effect that monitors the provided error condition and
   * automatically restores data to its original state when an error is detected.
   * The effect will:
   * 1. Clear any pending updates (if provided)
   * 2. Restore local data to match the original data
   * 3. Log an error message
   *
   * @template T The type of data being managed
   * @param {RollbackConfig<T>} config Configuration object for rollback behavior
   * @param {() => boolean} config.isError - Function that returns whether an error state is currently active
   * @param {() => T[] | undefined} config.originalData - Function that returns the original/source data to rollback to
   * @param {WritableSignal<T[]>} config.localData - Writable signal containing the local copy of the data
   * @param {WritableSignal<Map<string, T>>} [config.pendingUpdates] - Optional writable signal containing pending updates/modifications
   * @param {string} [config.errorMessage] - Optional custom error message to log when rollback is triggered
   *
   * @returns {() => void} Cleanup function to destroy the effect.
   *                       Must be called to prevent memory leaks, typically in ngOnDestroy.
   *
   * @throws {Error} May throw if the effect cannot be created or if signal operations fail
   *
   * @example
   * ```typescript
   * const cleanup = rollbackService.setupErrorRollback({
   *   isError: () => this.taskManager.isError(),
   *   originalData: () => this.tasks(),
   *   localData: this.localTasks,
   *   pendingUpdates: this.pendingUpdates,
   *   errorMessage: 'Task operation failed, reverting changes'
   * });
   *
   * // Later, in ngOnDestroy:
   * cleanup();
   * ```
   */
  public setupErrorRollback<T>(config: RollbackConfig<T>): () => void {
    const rollbackEffect = effect(() => {
      if (config.isError()) {
        const errorMsg =
          config.errorMessage ?? 'Error detected, rolling back state';
        console.error(errorMsg);

        if (config.pendingUpdates) {
          config.pendingUpdates.set(new Map());
        }

        const originalData = config.originalData();
        if (originalData) {
          config.localData.set([...originalData]);
        }
      }
    });

    return () => rollbackEffect.destroy();
  }
}
