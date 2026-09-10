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
    state.projects.set([]);
    manager = TestBed.inject(ProjectManager);
  });

  it('counts nothing while the projects are empty', () => {
    expect(manager.projects()).toEqual([]);
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

    state.projects.set([]);
    expect(manager.projectCount()).toBe(0);
  });

  describe('the project the screens are looking at', () => {
    it('is none of them until one is chosen', () => {
      expect(manager.selectedProject()).toBeNull();
    });

    /** Derived from the id and the list, so a rename shows through it. */
    it('follows the list rather than keeping a copy', () => {
      state.projects.set([sampleProject({ id: 'p-1', title: 'Before' })]);
      manager.selectProject('p-1');

      expect(manager.selectedProject()?.title).toBe('Before');

      state.projects.set([sampleProject({ id: 'p-1', title: 'After' })]);

      expect(manager.selectedProject()?.title).toBe('After');
    });

    it('answers nothing for an id the list does not hold', () => {
      state.projects.set([sampleProject({ id: 'p-1' })]);
      manager.selectProject('p-2');

      expect(manager.selectedProjectId()).toBe('p-2');
      expect(manager.selectedProject()).toBeNull();
    });
  });
});
