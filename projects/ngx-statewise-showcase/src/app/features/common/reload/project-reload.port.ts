/**
 * Asking the projects to be reloaded, from outside the feature that owns them.
 *
 * `settled()` rather than `reloaded()`: the project manager waits on every
 * effect it started, whichever action started it, where the task manager waits
 * on one action type. The two are not the same promise, so they do not share a
 * name.
 */
export interface IProjectReload {
  getAll(): void;
  reset(): Promise<void>;
  /** Settles once every effect this port started is over. */
  settled(): Promise<void>;
}
