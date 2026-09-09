import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { Project, PROJECT, Task, TASKS, User, USERS } from './db.data';

/*
 * The rows a stand-in server keeps.
 *
 * `new FakeBackend(...)` runs once per request, so a copy taken in a DB's field
 * initialiser forgot every write the moment it answered — a created task was
 * gone by the next reload, and a status change only looked like it stuck
 * because the updater had applied it optimistically. These live as long as the
 * tab, which is what a server looks like from here. The constants in
 * `db.data.ts` stay untouched, so a page reload starts the demo over.
 */
const USER_ROWS: User[] = [...USERS];
const TASK_ROWS: Task[] = [...TASKS];
const PROJECT_ROWS: Project[] = [...PROJECT];

type RequestHandlers = Record<
  string,
  Record<string, () => HttpResponse<unknown>>
>;

export class FakeBackend {
  private readonly usersDB = new UsersDB();
  private readonly taskDB = new TaskDB();
  private readonly projectDB = new ProjectDB();

  constructor(private readonly request: HttpRequest<Record<string, unknown>>) {}

  handleRequest(): Observable<HttpResponse<unknown>> {
    const requestsMapHandlers: RequestHandlers = {
      POST: {
        'http://localhost/api/Auth/login': () => this.handleLogin(),
        'http://localhost/api/Auth/logout': () => this.handleLogout(),
        'http://localhost/api/Auth/Authenticate': () =>
          this.handleAuthenticate(),
        'http://localhost/api/Project': () => this.handleCreateProject(),
        'http://localhost/api/Task': () => this.handleCreateTask(),
      },
      GET: {
        'http://localhost/api/Task': () => this.handleGetAllTask(),
        'http://localhost/api/Task/search': () => this.handleSearchTask(),
        'http://localhost/api/Project': () => this.handleGetAllProject(),
      },
      PATCH: {
        'http://localhost/api/Task': () => this.handleUpdateTask(),
      },
    };

    const { method, url } = this.request;

    const unauthorized = this.rejectUnauthenticated();
    if (unauthorized)
      return throwError(() => this.asErrorResponse(unauthorized));

    // A method the map does not carry has no urls to look in, which used to
    // be an index into `undefined` rather than the 400 below.
    const handler = requestsMapHandlers[method]?.[url];

    if (handler) {
      const response = handler();
      if (response.status < 400) return of(response);

      return throwError(() => this.asErrorResponse(response));
    }
    return throwError(() => this.respond400Error(`Cannot ${method} ${url}`));
  }

  private handleLogin(): HttpResponse<unknown> {
    const { body } = this.request;

    if (!body) return this.respond400Error();

    const password = body['password'];
    if (!password) return this.respond400Error('password type is missing');
    const email = body['email'];
    if (!email) return this.respond400Error('password type is missing');

    const user = this.usersDB.findByUsernameAndPassword(
      email as string,
      password as string,
    );

    if (!user) return this.respond400Error('Username or password is incorrect');

    document.cookie = `refresh_token=${user.refreshToken}; Path=/; Max-Age=604800; SameSite=Strict`;

    return this.respondSuccess({
      userId: user.id,
      userName: user.username,
      role: user.role,
      organizationId: user.organizationId,
      email: user.email,
      accessToken: user.accessToken,
      expirationTime: 3600,
    });
  }

  private handleAuthenticate(): HttpResponse<unknown> {
    const refreshToken = this.getCookie('refresh_token');
    if (!refreshToken)
      return this.respond400Error('refreshToken cookie is missing');

    const user = this.usersDB.findByRefreshToken(refreshToken);

    if (!user) return this.respond400Error('refreshToken is incorrect');

    return this.respondSuccess({
      success: true,
      accessToken: user.accessToken,
    });
  }

  private handleLogout(): HttpResponse<unknown> {
    document.cookie = `refresh_token=; Path=/; Max-Age=0; SameSite=Strict`;
    return this.respondSuccess({});
  }

  private handleGetAllTask(): HttpResponse<unknown> {
    const asking = this.requestingUser();

    if ('error' in asking) return asking.error;

    return this.respondSuccess(this.taskDB.findByUserOrganization(asking.user));
  }

  /**
   * A filtered search, answered by the server rather than the client.
   *
   * It exists so the showcase has one endpoint worth cancelling: two keystrokes
   * put two of these in flight, and the interceptor's 200 ms of latency is
   * enough for the first to still be running when the second starts.
   */
  private handleSearchTask(): HttpResponse<unknown> {
    const asking = this.requestingUser();

    if ('error' in asking) return asking.error;

    const query = (this.request.params.get('q') ?? '').trim().toLowerCase();
    const visible = this.taskDB.findByUserOrganization(asking.user);

    // An empty query matches everything, which is what "no filter" looks like
    // to a server. The client decides not to ask in that case.
    if (query === '') return this.respondSuccess(visible);

    return this.respondSuccess(
      visible.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description ?? '').toLowerCase().includes(query),
      ),
    );
  }

  private handleUpdateTask(): HttpResponse<unknown> {
    const { body } = this.request;
    const taskId = this.request.params.get('taskId');
    const asking = this.requestingUser();

    if ('error' in asking) return asking.error;
    if (!body) return this.respond400Error();
    if (!taskId) return this.respond400Error('taskId is missing');

    /*
     * One rule a drag can actually break, which is what the rollback needed.
     *
     * Every handler used to answer 200 to anything a signed-in user could ask,
     * so `pendingWrites` keeping the version it replaced — the care that lets a
     * failure restore its own card and leave the others where the user dropped
     * them — had no path a click could reach. Six of the nine tasks in the
     * fixture carry nobody, so dragging one to Done finds this straight away.
     *
     * Checked before the write, so a refusal leaves the row untouched.
     */
    const existing = this.taskDB.findByIdForUser(taskId, asking.user);

    if (
      (body as Partial<Task>).status === 'done' &&
      existing &&
      (existing.assignedUserIds ?? []).length === 0
    ) {
      return this.respond400Error(
        'assign someone to this task before marking it done',
      );
    }

    // Unchecked, this answered 200 with an empty body for a task the caller
    // may not touch, and the success action then travelled without a payload.
    const updated = this.taskDB.update(taskId, body, asking.user);

    if (!updated)
      return this.respond400Error('no such task in your organisation');

    return this.respondSuccess(updated);
  }

  /**
   * A server that refuses.
   *
   * Everything the showcase does most carefully — the optimistic rollback,
   * `isError` on both domains, the two "Try again" buttons — had no path a
   * click could reach, because every handler answered 200 to anything a
   * signed-in user could ask. A creation is the one place a refusal is
   * ordinary: a blank title, or a name already taken.
   */
  private handleCreateProject(): HttpResponse<unknown> {
    const user = this.requestingUser();

    if ('error' in user) return user.error;

    const { title, color } = (this.request.body ?? {}) as Record<
      string,
      unknown
    >;
    const refusal = this.refuseTitle(title);

    if (refusal) return refusal;
    if (typeof color !== 'string')
      return this.respond400Error('a colour is required');

    const trimmed = (title as string).trim();

    if (
      this.projectDB
        .findByUserOrganization(user.user)
        .some(
          (project) => project.title.toLowerCase() === trimmed.toLowerCase(),
        )
    ) {
      return this.respond400Error(`a project is already called "${trimmed}"`);
    }

    return this.respondSuccess(
      this.projectDB.create(
        {
          id: `project-${String(Date.now())}`,
          title: trimmed,
          color,
          organizationId: user.user.organizationId,
        } as Project,
        user.user,
      ),
    );
  }

  private handleCreateTask(): HttpResponse<unknown> {
    const user = this.requestingUser();

    if ('error' in user) return user.error;

    const body = (this.request.body ?? {}) as Record<string, unknown>;
    const refusal = this.refuseTitle(body['title']);

    if (refusal) return refusal;

    const projectId = body['projectId'];

    if (typeof projectId !== 'string') {
      return this.respond400Error('a project is required');
    }
    if (!this.projectDB.findByIdForUser(projectId, user.user)) {
      return this.respond400Error('no such project in your organisation');
    }

    const trimmed = (body['title'] as string).trim();

    if (
      this.taskDB
        .findByProjectIdForUser(projectId, user.user)
        .some((task) => task.title.toLowerCase() === trimmed.toLowerCase())
    ) {
      return this.respond400Error(
        `this project already has a task called "${trimmed}"`,
      );
    }

    const now = new Date().toISOString();

    return this.respondSuccess(
      this.taskDB.create(
        {
          ...body,
          id: `task-${String(Date.now())}`,
          title: trimmed,
          projectId,
          organizationId: user.user.organizationId,
          createdAt: now,
          updatedAt: now,
        } as Task,
        user.user,
      ),
    );
  }

  /** Blank counts as missing: a title of spaces names nothing. */
  private refuseTitle(title: unknown): HttpResponse<unknown> | null {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return this.respond400Error('a title is required');
    }

    return null;
  }

  /**
   * Who is asking, or the refusal to hand back instead. Four handlers repeated
   * these two checks and their two sentences.
   */
  private requestingUser():
    { readonly user: User } | { readonly error: HttpResponse<unknown> } {
    const userId = this.request.params.get('userId');

    if (!userId) return { error: this.respond400Error('userId is missing') };

    const user = this.usersDB.findByUserId(userId);

    if (!user) return { error: this.respond400Error('user does not exist') };

    return { user };
  }

  private handleGetAllProject(): HttpResponse<unknown> {
    const asking = this.requestingUser();

    if ('error' in asking) return asking.error;

    return this.respondSuccess(
      this.projectDB.findByUserOrganization(asking.user),
    );
  }

  private respondSuccess(body: unknown): HttpResponse<unknown> {
    const { headers, url } = this.request;
    return new HttpResponse({ status: 200, headers, url, body });
  }

  private respond400Error(message = 'Bad request'): HttpResponse<unknown> {
    return new HttpResponse({
      status: 400,
      body: { message },
    });
  }

  private respond401Error(message = 'Unauthorized'): HttpResponse<unknown> {
    return new HttpResponse({
      status: 401,
      body: { message },
    });
  }

  /**
   * Everything but the auth endpoints needs a bearer token this backend knows.
   *
   * This is what makes the access-token interceptor's 401 branch a real path:
   * clear the stored token, ask for the tasks again, and the interceptor
   * renews it from the refresh cookie and replays the request.
   */
  private rejectUnauthenticated(): HttpResponse<unknown> | null {
    if (this.request.url.includes('/Auth/')) {
      return null;
    }

    const authorization = this.request.headers.get('Authorization');
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : null;

    if (!accessToken) {
      return this.respond401Error('Authorization header is missing');
    }

    return this.usersDB.findByAccessToken(accessToken)
      ? null
      : this.respond401Error('access token is unknown');
  }

  private asErrorResponse(response: HttpResponse<unknown>): HttpErrorResponse {
    return new HttpErrorResponse({
      status: response.status,
      // `statusText` defaults to 'OK' and is never null, so the `??` that used
      // to sit here was dead and every error carried statusText: 'OK'.
      statusText: response.status >= 500 ? 'Server Error' : 'Bad Request',
      error: response.body,
      url: this.request.url,
    });
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()!.split(';').shift() ?? null;
    return null;
  }
}

class UsersDB {
  private readonly users = USER_ROWS;

  findByUsernameAndPassword(email: string, password: string) {
    return this.users.find(
      (user) => user.email === email && user.password === password,
    );
  }

  findByAccessToken(accessToken: string) {
    return this.users.find((user) => user.accessToken === accessToken);
  }

  findByRefreshToken(refreshToken: string) {
    return this.users.find((user) => user.refreshToken === refreshToken);
  }

  /*
   * `[...]`, and it is not a nicety.
   *
   * The admin branch used to hand back the storage array itself. So a `GET`
   * answered with the very array the module keeps, `state.set(response)` gave
   * the signal that array to hold, and the next `create()` pushed into it —
   * putting a row into the application's state with no action dispatched.
   * Then the success handler appended it again, and one creation showed up
   * twice with one id. A filtered branch was never affected, because `filter`
   * already copies; only the shortcut for the role that reads everything was.
   */
  findByOrganizationId(user: User, organizationId: string): User[] {
    if (user.role === 'admin') return [...this.users];
    return this.users.filter((user) => user.organizationId === organizationId);
  }

  findByUserId(id: string) {
    return this.users.find((user) => user.id === id);
  }
}

export class TaskDB {
  private readonly tasks = TASK_ROWS;

  findByIdForUser(taskId: string, user: User): Task | undefined {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return undefined;
    if (user.role === 'admin' || task.organizationId === user.organizationId)
      return task;
    return undefined;
  }

  findByProjectIdForUser(projectId: string, user: User): Task[] {
    return this.tasks.filter(
      (task) =>
        task.projectId === projectId &&
        (user.role === 'admin' || task.organizationId === user.organizationId),
    );
  }

  findByOrganizationId(organizationId: string): Task[] {
    return this.tasks.filter((task) => task.organizationId === organizationId);
  }

  /** Copied for the same reason as `UsersDB.findByOrganizationId`. */
  findByUserOrganization(user: User): Task[] {
    if (user.role === 'admin') return [...this.tasks];
    return this.tasks.filter(
      (task) => task.organizationId === user.organizationId,
    );
  }

  create(task: Task, user: User): Task | undefined {
    if (user.role !== 'admin' && task.organizationId !== user.organizationId)
      return undefined;
    this.tasks.push(task);
    return task;
  }

  update(taskId: string, data: Partial<Task>, user: User): Task | undefined {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    const existingTask = this.tasks[index];

    if (!existingTask) return undefined;
    if (
      user.role !== 'admin' &&
      existingTask.organizationId !== user.organizationId
    )
      return undefined;

    const updatedTask: Task = {
      ...existingTask,
      ...data,
      id: existingTask.id,
      updatedAt: new Date().toISOString(),
    };

    this.tasks[index] = updatedTask;
    return updatedTask;
  }

  delete(taskId: string, user: User): boolean {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    const task = this.tasks[index];

    if (!task) return false;
    if (user.role !== 'admin' && task.organizationId !== user.organizationId)
      return false;

    this.tasks.splice(index, 1);
    return true;
  }
}

export class ProjectDB {
  private readonly project = PROJECT_ROWS;

  create(project: Project, user: User): Project | undefined {
    if (user.role !== 'admin' && project.organizationId !== user.organizationId)
      return undefined;
    this.project.push(project);
    return project;
  }

  findByIdForUser(ProjectId: string, user: User): Project | undefined {
    const task = this.project.find((t) => t.id === ProjectId);
    if (!task) return undefined;
    if (user.role === 'admin' || task.organizationId === user.organizationId)
      return task;
    return undefined;
  }

  findByOrganizationId(organizationId: string): Project[] {
    return this.project.filter(
      (project) => project.organizationId === organizationId,
    );
  }

  /** Copied for the same reason as `UsersDB.findByOrganizationId`. */
  findByUserOrganization(user: User): Project[] {
    if (user.role === 'admin') return [...this.project];
    return this.project.filter(
      (project) => project.organizationId === user.organizationId,
    );
  }
}
