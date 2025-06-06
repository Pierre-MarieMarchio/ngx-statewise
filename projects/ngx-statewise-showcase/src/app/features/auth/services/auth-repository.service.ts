import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponses, AuthenticateResponses } from '../models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = environment.API_BASE_URL;

  public login(
    request: LoginRequest
  ): Observable<HttpResponse<LoginResponses>> {
    const response = this.http.post<LoginResponses>(
      `${this.API_BASE_URL}/Auth/login`,
      request,
      { observe: 'response', withCredentials: true }
    );
    return response;
  }

  public logout(): Observable<HttpResponse<void>> {
    const response = this.http.post<void>(
      `${this.API_BASE_URL}/Auth/logout`,
      null,
      { observe: 'response', withCredentials: true }
    );
    return response;
  }

  public authenticate(): Observable<HttpResponse<AuthenticateResponses>> {
    const response = this.http.post<AuthenticateResponses>(
      `${this.API_BASE_URL}/Auth/Authenticate`,
      null,
      { observe: 'response', withCredentials: true }
    );
    return response;
  }

  public test(): Observable<HttpResponse<{}>> {
    const response = this.http.get<{}>(
      `${this.API_BASE_URL}/Auth/test-cookie`,

      { observe: 'response', withCredentials: true }
    );
    return response;
  }
}
