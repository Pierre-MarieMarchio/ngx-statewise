import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { sampleProject } from '@testing/fake-managers';
import { getAllProjectsActions, projectReset } from './project.action';
import { ProjectState } from './project.state';
import { projectUpdater } from './project.updater';

const PROJECTS = [sampleProject()];

/**
 * No effects are registered, so a dispatch runs the updater and nothing else.
 * What is under test is the state machine, not the repository behind it.
 */
describe('projectUpdater', () => {
  let statewise: Statewise;
  let state: ProjectState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting()],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(projectUpdater),
    );
    state = TestBed.inject(ProjectState);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts loading and clears a previous error on a request', () => {
    statewise.dispatch(getAllProjectsActions.failure());
    expect(state.isError()).toBe(true);

    statewise.dispatch(getAllProjectsActions.request());

    expect(state.isLoading()).toBe(true);
    expect(state.isError()).toBe(false);
  });

  it('fills the projects and stops loading on success', () => {
    statewise.dispatch(getAllProjectsActions.request());
    statewise.dispatch(getAllProjectsActions.success(PROJECTS));

    expect(state.projects()).toEqual(PROJECTS);
    expect(state.isLoading()).toBe(false);
  });

  it('marks the error and stops loading on failure', () => {
    statewise.dispatch(getAllProjectsActions.request());
    statewise.dispatch(getAllProjectsActions.failure());

    expect(state.isError()).toBe(true);
    expect(state.isLoading()).toBe(false);
  });

  /**
   * A retry that succeeds has to clear the error, or the page keeps reporting a
   * failure that is over. Before the request cleared it, only a logout did.
   */
  it('leaves no error behind once a retry succeeds', () => {
    statewise.dispatch(getAllProjectsActions.failure());

    statewise.dispatch(getAllProjectsActions.request());
    statewise.dispatch(getAllProjectsActions.success(PROJECTS));

    expect(state.isError()).toBe(false);
    expect(state.projects()).toEqual(PROJECTS);
  });

  it('empties the projects and clears both flags on a reset', () => {
    statewise.dispatch(getAllProjectsActions.success(PROJECTS));
    statewise.dispatch(getAllProjectsActions.request());
    statewise.dispatch(getAllProjectsActions.failure());

    statewise.dispatch(projectReset());

    expect(state.projects()).toEqual([]);
    expect(state.isLoading()).toBe(false);
    expect(state.isError()).toBe(false);
  });
});
