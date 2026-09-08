import { Signal } from '@angular/core';
import { Project } from '@app/features/project/models';

export interface IProjectManager {
  projects: Signal<Project[] | null>;
  isError: Signal<boolean>;
  isLoading: Signal<boolean>;

  /** Derived from the projects. */
  projectCount: Signal<number>;

  getAll(): void;
  /** Settles once every effect this manager started is over. */
  settled(): Promise<void>;
  getAllAsync(): Promise<void>;
  reset(): Promise<void>;
}
