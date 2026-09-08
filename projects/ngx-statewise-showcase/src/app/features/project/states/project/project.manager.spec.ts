import { TestBed } from '@angular/core/testing';
import { provideStatewise } from 'ngx-statewise';
import { sampleProject } from '@testing/fake-managers';
import { ProjectManager } from './project.manager';
import { ProjectState } from './project.state';

describe('ProjectManager', () => {
  let manager: ProjectManager;
  let state: ProjectState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewise({})],
    });

    state = TestBed.inject(ProjectState);
    state.projects.set(null);
    manager = TestBed.inject(ProjectManager);
  });

  it('counts nothing while the projects have not been loaded', () => {
    expect(manager.projects()).toBeNull();
    expect(manager.projectCount()).toBe(0);
  });

  it('derives the count from the projects', () => {
    state.projects.set([
      sampleProject({ id: 'project-1' }),
      sampleProject({ id: 'project-2' }),
    ]);

    expect(manager.projectCount()).toBe(2);
  });

  it('falls back to zero once the projects are reset', () => {
    state.projects.set([sampleProject()]);
    expect(manager.projectCount()).toBe(1);

    state.projects.set(null);
    expect(manager.projectCount()).toBe(0);
  });
});
