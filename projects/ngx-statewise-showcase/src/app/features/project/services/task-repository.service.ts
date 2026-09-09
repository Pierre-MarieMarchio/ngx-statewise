import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, fromEvent, Observable, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Task, TaskDraft } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TaskRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = `${environment.API_BASE_URL}/Task`;

  getAll(userId: string): Observable<Task[]> {
    const params = this.buildAccessParams(userId);
    return this.http.get<Task[]>(this.API_BASE_URL, { params });
  }

  create(draft: TaskDraft, userId: string): Observable<Task> {
    const params = this.buildAccessParams(userId);
    return this.http.post<Task>(this.API_BASE_URL, draft, { params });
  }

  update(
    taskId: string,
    data: Partial<Task>,
    userId: string,
  ): Observable<Task> {
    let params = this.buildAccessParams(userId);
    params = params.set('taskId', taskId);
    return this.http.patch<Task>(`${this.API_BASE_URL}`, data, {
      params,
    });
  }

  /**
   * The tasks matching a query, and the one call in this repository that takes
   * an `AbortSignal`.
   *
   * `HttpClient` does not accept one, so the signal is bridged to the thing it
   * does understand: unsubscription. `takeUntil` on the abort event tears the
   * subscription down and Angular cancels the request underneath. Without it,
   * `concurrency: 'latest'` would drop the superseded answer but leave its
   * request running to completion — which is the difference the guide draws
   * between abandoning a promise and stopping the work.
   *
   * On abort the source completes without emitting, so the promise rejects.
   * The effect tells that apart from a real failure by reading `aborted`.
   *
   * One honest caveat about the demo: the stand-in server is an interceptor, so
   * nothing reaches the network and there is no socket for the browser to drop.
   * The teardown is real all the same — `task-repository.service.spec.ts`
   * asserts it through `HttpTestingController`, which reports the request as
   * `cancelled` — and against a real server it is what cancels the request.
   */
  search(
    query: string,
    userId: string,
    abortSignal: AbortSignal,
  ): Promise<Task[]> {
    const params = this.buildAccessParams(userId).set('q', query);

    return firstValueFrom(
      this.http
        .get<Task[]>(`${this.API_BASE_URL}/search`, { params })
        .pipe(takeUntil(fromEvent(abortSignal, 'abort'))),
    );
  }

  delete(userId: string, taskId: string): Observable<void> {
    let params = this.buildAccessParams(userId);
    params = params.set('taskId', taskId);
    return this.http.delete<void>(`${this.API_BASE_URL}`, { params });
  }

  private buildAccessParams(userId: string): HttpParams {
    let params = new HttpParams();
    params = params.set('userId', userId);
    return params;
  }
}
