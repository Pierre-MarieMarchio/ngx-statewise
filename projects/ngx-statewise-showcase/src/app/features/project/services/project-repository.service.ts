import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Project, ProjectDraft } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ProjectRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = `${environment.API_BASE_URL}/Project`;

  getAll(userId: string): Observable<Project[]> {
    const params = this.buildAccessParams(userId);
    return this.http.get<Project[]>(this.API_BASE_URL, { params });
  }

  create(draft: ProjectDraft, userId: string): Observable<Project> {
    const params = this.buildAccessParams(userId);
    return this.http.post<Project>(this.API_BASE_URL, draft, { params });
  }

  private buildAccessParams(userId: string): HttpParams {
    let params = new HttpParams();
    params = params.set('userId', userId);
    return params;
  }
}
