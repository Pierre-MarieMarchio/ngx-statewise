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
    /*
     * The count is the assertion, and a unique title is what makes it possible.
     *
     * `toContain` was chosen because the stand-in server keeps its rows for the
     * life of the module, so a test sees what the one before it created and a
     * total is not stable. That reason still holds — but counting one title
     * nobody else uses satisfies both, and it is the assertion this suite was
     * missing: creating one project used to put two in the state, identical and
     * sharing an id, and every assertion here passed.
     */
    it('accepts one and keeps it once, without a reload', async () => {
      await projects.createProject({ title: 'Analytics', color: 'orange' });

      expect(projects.createError()).toBeNull();
      expect(
        projects.projects().filter((project) => project.title === 'Analytics'),
      ).toHaveLength(1);
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
    it('accepts one into a project the user can see, once', async () => {
      const project = at(projects.projects());

      await tasks.createTask({
        projectId: project.id,
        title: 'Wire the create form',
        status: 'todo',
        priority: 'low',
      });

      expect(tasks.createError()).toBeNull();

      // Counted, for the reason spelled out over the project case above.
      const created = tasks
        .tasks()
        .filter((task) => task.title === 'Wire the create form');

      expect(created).toHaveLength(1);
      expect(at(created).projectId).toBe(project.id);
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
      expect(tasks.isSaving()).toBe(false);
      // The server's own sentence, not a banner about a list that loaded fine.
      expect(tasks.saveError()).toBe(
        'assign someone to this task before marking it done',
      );
      expect(tasks.isError()).toBe(false);
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

  /**
   * The lot's own question, answered by the server rather than by a dialog:
   * removing a project that still holds tasks is refused, and the refusal says
   * how many stand in the way. A cascade would have been one line in the
   * handler and the one destructive thing this demo does, done in silence.
   */
  describe('renaming and removing a project', () => {
    const uniquely = (name: string): string => `${name}-${String(Date.now())}`;

    it('renames one, and the list holds the new name', async () => {
      const title = uniquely('Renameable');
      await projects.createProject({ title, color: 'blue' });
      const created = projects
        .projects()
        .find((project) => project.title === title);

      expect(created).toBeDefined();
      if (!created) return;

      await projects.updateProject({ ...created, title: `${title}-renamed` });

      expect(projects.saveError()).toBeNull();
      expect(
        projects.projects().find((project) => project.id === created.id)?.title,
      ).toBe(`${title}-renamed`);
    });

    it('refuses a rename onto a name already taken', async () => {
      const taken = uniquely('Taken');
      const other = uniquely('Other');
      await projects.createProject({ title: taken, color: 'blue' });
      await projects.createProject({ title: other, color: 'green' });

      const toRename = projects
        .projects()
        .find((project) => project.title === other);

      expect(toRename).toBeDefined();
      if (!toRename) return;

      await projects.updateProject({ ...toRename, title: taken });

      expect(projects.saveError()).toBe(
        `a project is already called "${taken}"`,
      );
      expect(
        projects.projects().find((project) => project.id === toRename.id)
          ?.title,
      ).toBe(other);
    });

    it('removes an empty one', async () => {
      const title = uniquely('Empty');
      await projects.createProject({ title, color: 'pink' });
      const created = projects
        .projects()
        .find((project) => project.title === title);

      expect(created).toBeDefined();
      if (!created) return;

      projects.selectProject(created.id);
      await projects.deleteProject(created.id);

      expect(projects.saveError()).toBeNull();
      expect(
        projects.projects().find((project) => project.id === created.id),
      ).toBeUndefined();
      // What no longer exists cannot go on being the current project.
      expect(projects.selectedProjectId()).toBeNull();
    });

    it('refuses to remove one that still holds a task, and says how many', async () => {
      const title = uniquely('Occupied');
      await projects.createProject({ title, color: 'purple' });
      const created = projects
        .projects()
        .find((project) => project.title === title);

      expect(created).toBeDefined();
      if (!created) return;

      await tasks.createTask({
        projectId: created.id,
        title: uniquely('In the way'),
        status: 'todo',
        priority: 'low',
      });

      await projects.deleteProject(created.id);

      expect(projects.saveError()).toBe('this project still holds 1 task');
      expect(
        projects.projects().find((project) => project.id === created.id),
      ).toBeDefined();
    });

    it('takes it once the task standing in the way is gone', async () => {
      const title = uniquely('Clearable');
      await projects.createProject({ title, color: 'green' });
      const created = projects
        .projects()
        .find((project) => project.title === title);

      expect(created).toBeDefined();
      if (!created) return;

      const taskTitle = uniquely('To remove');
      await tasks.createTask({
        projectId: created.id,
        title: taskTitle,
        status: 'todo',
        priority: 'low',
      });
      const task = tasks.tasks().find((row) => row.title === taskTitle);

      expect(task).toBeDefined();
      if (!task) return;

      await tasks.deleteTask(task.id);

      expect(tasks.saveError()).toBeNull();
      expect(tasks.tasks().find((row) => row.id === task.id)).toBeUndefined();

      await projects.deleteProject(created.id);

      expect(projects.saveError()).toBeNull();
      expect(
        projects.projects().find((project) => project.id === created.id),
      ).toBeUndefined();
    });
  });
});
