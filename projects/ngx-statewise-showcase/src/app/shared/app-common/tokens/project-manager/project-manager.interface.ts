import { Signal } from "@angular/core";
import { Project } from "@app/features/project/models";

export interface IProjectManager {
  projects: Signal<Project[] | null>;
  isError: Signal<boolean>;
  isLoading: Signal<boolean>;

  getAll(): void;
  getAllAsync(): Promise<void>;
  reset(): Promise<void>;
}
