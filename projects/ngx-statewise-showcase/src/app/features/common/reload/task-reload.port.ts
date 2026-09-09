/**
 * Asking the tasks to be reloaded, from outside the feature that owns them.
 *
 * Named for what the caller needs, not for what TaskManager is: the manager
 * has eleven members and this port has three, because three is what crossing
 * the boundary actually requires. It names no domain type at all.
 */
export interface ITaskReload {
  getAll(): void;
  reset(): Promise<void>;
  /** Settles once the reload this port started is over. */
  reloaded(): Promise<void>;
}
