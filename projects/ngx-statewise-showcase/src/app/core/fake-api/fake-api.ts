import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

import { Task, TASKS, User, USERS } from './db.data';

type RequestHandlers = Record<
  string,
  Record<string, () => HttpResponse<unknown>>
>;

export class FakeApi {
  private readonly usersDB = new UsersDB();
  private readonly taskDB = new TaskDB();

  constructor(private readonly request: HttpRequest<Record<string, unknown>>) {}

  handleRequest(): Observable<HttpResponse<unknown>> {
    const requestsMapHandlers: RequestHandlers = {
      POST: {
        'http://localhost/api/Auth/login': () => this.handleLogin(),
        'http://localhost/api/Auth/logout': () => this.handleLogout(),
        'http://localhost/api/Auth/Authenticate': () =>
          this.handleAuthenticate(),
      },
      GET: {
        'http://localhost/api/Task': () => this.handleGetAllTask(),
      },
    };

    const { method, url } = this.request;
    const handler = requestsMapHandlers[method][url];

    if (handler) {
      const response = handler();
      if (response.status < 400) return of(response);

      return throwError(
        () =>
          new HttpErrorResponse({
            status: response.status,
            statusText: response.statusText ?? 'Bad Request',
            error: response.body,
            url: this.request.url,
          })
      );
    }
    return throwError(() => this.respond400Error(`Cannot ${method} ${url}`));
  }

  private handleLogin(): HttpResponse<unknown> {
    const { body } = this.request;

    if (!body) return this.respond400Error();

    // validate body
    const password = body['password'];
    if (!password) return this.respond400Error('password type is missing');
    const email = body['email'];
    if (!email) return this.respond400Error('password type is missing');

    const user = this.usersDB.findByUsernameAndPassword(
      email as string,
      password as string
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
    const userId = this.request.params.get('userid');

    if (!userId) return this.respond400Error('userId is missing');
    const user = this.usersDB.findByUserId(userId)

    if (!user) return this.respond400Error('user does not exist');
    const tasks = this.taskDB.findByUserOrganization(user)

    return this.respondSuccess(tasks);
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

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()!.split(';').shift() ?? null;
    return null;
  }
}

class UsersDB {
  private users: User[] = [...USERS]

  findByUsernameAndPassword(email: string, password: string) {
    return this.users.find(
      (user) => user.email === email && user.password === password
    );
  }

  findByAccessToken(accessToken: string) {
    return this.users.find((user) => user.accessToken === accessToken);
  }

  findByRefreshToken(refreshToken: string) {
    return this.users.find((user) => user.refreshToken === refreshToken);
  }

  findByOrganizationId(user: User, organizationId: string): User[] {
    if (user.role === 'admin') return this.users;
    return this.users.filter(
      (user) => user.organizationId === organizationId
    );
  }

  findByUserId(id: string) {
    return this.users.find((user) => user.id === id);
  }
}

export class TaskDB {
  private tasks: Task[] = [...TASKS];

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
        (user.role === 'admin' || task.organizationId === user.organizationId)
    );
  }

  findByOrganizationId(organizationId: string): Task[] {
    return this.tasks.filter((task) => task.organizationId === organizationId);
  }

  findByUserOrganization(user: User): Task[] {
    if (user.role === 'admin') return this.tasks;
    return this.tasks.filter(
      (task) => task.organizationId === user.organizationId
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
    if (index === -1) return undefined;

    const existingTask = this.tasks[index];
    if (
      user.role !== 'admin' &&
      existingTask.organizationId !== user.organizationId
    )
      return undefined;

    const updatedTask = {
      ...existingTask,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.tasks[index] = updatedTask;
    return updatedTask;
  }

  delete(taskId: string, user: User): boolean {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return false;

    const task = this.tasks[index];
    if (user.role !== 'admin' && task.organizationId !== user.organizationId)
      return false;

    this.tasks.splice(index, 1);
    return true;
  }
}