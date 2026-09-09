import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
