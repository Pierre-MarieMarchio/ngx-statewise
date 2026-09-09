import { TestBed } from '@angular/core/testing';
import { appConfig } from '@app/app.config';
import { AuthManager } from '@app/features/auth/states';
import { ProjectManager } from '@app/features/project/states/project/project.manager';
import { TaskManager } from '@app/features/project/states/task/task.manager';
import { drainEffects } from 'ngx-statewise/testing';
import { at } from '@testing/at';

const ADMIN = { email: 'admin@admin', password: 'admin' };

/**
 * Every handler of the fake backend used to answer 200 to anything a signed-in
 * user could ask, so the showcase's most careful logic had no path a click
 * could reach: the optimistic rollback, `isError` on the two domains, and the
 * two "Try again" buttons were exercised by unit tests alone.
 *
 * Two rules changed that, and this signs in through the real `appConfig` — the
 * whole provider set, the fake backend included — to prove a refusal actually
 * arrives.
 */
describe('a server that refuses', () => {
  /*
   * The fake backend keeps its rows for as long as the module is loaded, which
   * is what makes a creation survive a reload — and what makes a count taken in
   * one test wrong in the next. So each of these names what it created and
   * looks for that, and every title is its own.
   */
  let auth: AuthManager;
  let projects: ProjectManager;
  let tasks: TaskManager;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });

    auth = TestBed.inject(AuthManager);
    projects = TestBed.inject(ProjectManager);
    tasks = TestBed.inject(TaskManager);

    await auth.login(ADMIN);
    await projects.settled();
    await tasks.reloaded();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('creating a project', () => {
    it('accepts one and keeps it, without a reload', async () => {
      await projects.createProject({ title: 'Analytics', color: 'orange' });

      expect(projects.createError()).toBeNull();
      expect(projects.projects().map((project) => project.title)).toContain(
        'Analytics',
      );
      expect(projects.isCreating()).toBe(false);
    });

    it('refuses a blank title, in the words the server used', async () => {
      await projects.createProject({ title: '   ', color: 'orange' });

      expect(projects.createError()).toBe('a title is required');
      expect(projects.isCreating()).toBe(false);
    });

    it('refuses a name already taken, and names it', async () => {
      const [existing] = projects.projects();

      await projects.createProject({
        title: existing?.title ?? '',
        color: 'green',
      });

      expect(projects.createError()).toContain('already called');
    });

    it('clears the refusal on the next attempt', async () => {
      await projects.createProject({ title: '', color: 'orange' });
      expect(projects.createError()).not.toBeNull();

      await projects.createProject({ title: 'Cleared retry', color: 'pink' });

      expect(projects.createError()).toBeNull();
    });
  });

  describe('creating a task', () => {
    it('accepts one into a project the user can see', async () => {
      const project = at(projects.projects());

      await tasks.createTask({
        projectId: project.id,
        title: 'Wire the create form',
        status: 'todo',
        priority: 'low',
      });

      expect(tasks.createError()).toBeNull();
      expect(
        tasks.tasks().find((task) => task.title === 'Wire the create form')
          ?.projectId,
      ).toBe(project.id);
    });

    it('refuses a project it cannot find', async () => {
      await tasks.createTask({
        projectId: 'project-nowhere',
        title: 'Orphan',
        status: 'todo',
        priority: 'low',
      });

      expect(tasks.createError()).toBe('no such project in your organisation');
    });
  });

  /**
   * The one the rollback was written for. `pendingWrites` keeps the version
   * each write replaced, so a refusal restores its own card and leaves the
   * others where the user dropped them — and until now nothing but a unit test
   * had ever made it run.
   */
  describe('moving a task the server will not close', () => {
    it('puts the card back, and says so on the board', async () => {
      const unassigned = tasks
        .tasks()
        .find((task) => (task.assignedUserIds ?? []).length === 0);

      expect(unassigned).toBeDefined();
      if (!unassigned) return;

      const before = unassigned.status;

      tasks.update({ ...unassigned, status: 'done' });
      // `update` is fire-and-forget, so the library's own helper waits for it.
      await drainEffects();

      const after = tasks.tasks().find((task) => task.id === unassigned.id);

      expect(after?.status).toBe(before);
      expect(tasks.isError()).toBe(true);
      expect(tasks.isSaving()).toBe(false);
    });

    it('accepts the same move once somebody is assigned', async () => {
      const assigned = tasks
        .tasks()
        .find((task) => (task.assignedUserIds ?? []).length > 0);

      expect(assigned).toBeDefined();
      if (!assigned) return;

      tasks.update({ ...assigned, status: 'done' });
      // `update` is fire-and-forget, so the library's own helper waits for it.
      await drainEffects();

      expect(
        tasks.tasks().find((task) => task.id === assigned.id)?.status,
      ).toBe('done');
      expect(tasks.isError()).toBe(false);
    });
  });
});
