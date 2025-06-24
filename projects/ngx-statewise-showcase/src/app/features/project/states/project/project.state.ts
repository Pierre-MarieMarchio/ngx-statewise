import { Injectable, signal } from '@angular/core';
import { Project } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class ProjectState {
  public projects = signal<Project[] | null>(null);
  public isLoading = signal(false);
  public isError = signal(false);
}
