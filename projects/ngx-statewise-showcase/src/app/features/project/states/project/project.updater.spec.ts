import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { sampleProject } from '@testing/fake-managers';
import {
  createProjectActions,
  getAllProjectsActions,
  projectSelected,
  projectReset,
} from './project.action';
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

  describe('creating a project', () => {
    const DRAFT = { title: 'Analytics', color: 'orange' } as const;

    it('is creating, and no longer refused, while it runs', () => {
      statewise.dispatch(createProjectActions.failure('a title is required'));

      statewise.dispatch(createProjectActions.request(DRAFT));

      expect(state.isCreating()).toBe(true);
      expect(state.createError()).toBeNull();
    });

    /**
     * The server answered with the project, so the list already holds the
     * truth: waiting for a reload would blank the board it was created from.
     */
    it('joins the list on success, without a reload', () => {
      statewise.dispatch(getAllProjectsActions.success(PROJECTS));

      statewise.dispatch(createProjectActions.request(DRAFT));
      statewise.dispatch(
        createProjectActions.success({ ...sampleProject(), id: 'new' }),
      );

      expect(state.projects().map((project) => project.id)).toEqual([
        'project-1',
        'new',
      ]);
      expect(state.isCreating()).toBe(false);
    });

    it('keeps the reason it was refused, so a form can repeat it', () => {
      statewise.dispatch(createProjectActions.request(DRAFT));
      statewise.dispatch(
        createProjectActions.failure('a project is already called "Analytics"'),
      );

      expect(state.isCreating()).toBe(false);
      expect(state.createError()).toBe(
        'a project is already called "Analytics"',
      );
    });

    it('clears the refusal when the form tries again', () => {
      statewise.dispatch(createProjectActions.failure('a title is required'));

      statewise.dispatch(createProjectActions.request(DRAFT));

      expect(state.createError()).toBeNull();
    });

    it('leaves nothing behind on a reset', () => {
      statewise.dispatch(createProjectActions.request(DRAFT));
      statewise.dispatch(createProjectActions.failure('refused'));

      statewise.dispatch(projectReset());

      expect(state.isCreating()).toBe(false);
      expect(state.createError()).toBeNull();
    });
  });

  /**
   * Choosing is a decision, not a request: there is no effect behind this
   * action, and the state is right the moment it is dispatched.
   */
  describe('choosing a project', () => {
    it('keeps what was chosen, and lets it be unchosen', () => {
      statewise.dispatch(projectSelected('project-1'));
      expect(state.selectedProjectId()).toBe('project-1');

      statewise.dispatch(projectSelected(null));
      expect(state.selectedProjectId()).toBeNull();
    });

    /**
     * Leaving a dangling id would not show the wrong project — the derivation
     * finds nothing — but every list scoped by it filters down to nothing, so
     * the screens would go empty rather than back to showing everything.
     */
    it('drops a choice the next read no longer holds', () => {
      statewise.dispatch(projectSelected('project-1'));

      statewise.dispatch(
        getAllProjectsActions.success([sampleProject({ id: 'project-2' })]),
      );

      expect(state.selectedProjectId()).toBeNull();
    });

    it('keeps a choice the next read still holds', () => {
      statewise.dispatch(projectSelected('project-1'));

      statewise.dispatch(
        getAllProjectsActions.success([sampleProject({ id: 'project-1' })]),
      );

      expect(state.selectedProjectId()).toBe('project-1');
    });

    it('is forgotten along with the projects on a reset', () => {
      statewise.dispatch(projectSelected('project-1'));

      statewise.dispatch(projectReset());

      expect(state.selectedProjectId()).toBeNull();
    });
  });
});
