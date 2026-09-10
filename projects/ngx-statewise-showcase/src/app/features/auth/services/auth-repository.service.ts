import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LoginRequest,
  LoginResponses,
  AuthenticateResponses,
  User,
} from '../models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthRepositoryService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = environment.API_BASE_URL;

  public login(
    request: LoginRequest,
  ): Observable<HttpResponse<LoginResponses>> {
    const response = this.http.post<LoginResponses>(
      `${this.API_BASE_URL}/Auth/login`,
      request,
      { observe: 'response', withCredentials: true },
    );
    return response;
  }

  public logout(): Observable<HttpResponse<void>> {
    const response = this.http.post<void>(
      `${this.API_BASE_URL}/Auth/logout`,
      null,
      { observe: 'response', withCredentials: true },
    );
    return response;
  }

  /**
   * Everyone in the asking user's organisation.
   *
   * The one call here that answers with a list of people rather than with a
   * session. It is auth's to make, because a user's name is auth's to know,
   * and what a task does with the answer is another feature's business
   * entirely.
   */
  public members(userId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_BASE_URL}/User`, {
      params: new HttpParams().set('userId', userId),
    });
  }

  public authenticate(): Observable<HttpResponse<AuthenticateResponses>> {
    const response = this.http.post<AuthenticateResponses>(
      `${this.API_BASE_URL}/Auth/Authenticate`,
      null,
      { observe: 'response', withCredentials: true },
    );
    return response;
  }
}
