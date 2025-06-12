import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '@shared/app-common/models/auth-user.model';
import { Project } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ProjectRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = `${environment.API_BASE_URL}/Project`;

  getAll(user: User): Observable<Project[]> {
    const params = this.buildAccessParams(user);
    return this.http.get<Project[]>(this.API_BASE_URL, { params });
  }

  private buildAccessParams(user: User): HttpParams {
    let params = new HttpParams();
    params = params.set('userid', user.userId);
    return params;
  }
}
