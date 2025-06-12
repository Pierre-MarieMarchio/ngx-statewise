import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '@shared/app-common/models/auth-user.model';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = `${environment.API_BASE_URL}/Task`;

  getAll(user: User): Observable<Task[]> {
    const params = this.buildAccessParams(user);
    return this.http.get<Task[]>(this.API_BASE_URL, { params });
  }

  getById(taskId: string, user: User): Observable<Task> {
    const params = this.buildAccessParams(user);
    return this.http.get<Task>(`${this.API_BASE_URL}/${taskId}`, { params });
  }

  getByProjectId(projectId: string, user: User): Observable<Task[]> {
    let params = this.buildAccessParams(user);
    params = params.set('projectId', projectId);
    return this.http.get<Task[]>(this.API_BASE_URL, { params });
  }

  create(task: Task): Observable<Task> {
    return this.http.post<Task>(this.API_BASE_URL, task);
  }

  update(taskId: string, data: Partial<Task>): Observable<Task> {
    return this.http.patch<Task>(`${this.API_BASE_URL}/${taskId}`, data);
  }

  delete(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/${taskId}`);
  }

  private buildAccessParams(user: User): HttpParams {
    let params = new HttpParams();
    params = params.set('userid', user.userId);
    return params;
  }
}
