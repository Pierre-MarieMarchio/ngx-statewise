import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { LocalStorageService } from '@app/core/services';

@Injectable({
  providedIn: 'root',
})
export class AuthTokenService extends LocalStorageService {
  public setAccessToken(value: string): void {
    this.setItem(environment.ACCESS_TOKEN_KEY, value);
  }

  /** `null` when there is none, which is what a cold start looks like. */
  public getAccessToken(): string | null {
    return (this.getItem(environment.ACCESS_TOKEN_KEY) as string) ?? null;
  }

  public clearAccessToken(): void {
    this.removeItem(environment.ACCESS_TOKEN_KEY);
  }

  public setNewAccessTokenFromResponse(
    res: HttpResponse<{ accessToken: string }>,
  ): string {
    const newToken = res.body?.accessToken;

    if (!newToken) {
      // No credentials in the response: the caller's decode() rejects it.
      return '';
    }

    this.setAccessToken(newToken);

    return newToken;
  }
}
