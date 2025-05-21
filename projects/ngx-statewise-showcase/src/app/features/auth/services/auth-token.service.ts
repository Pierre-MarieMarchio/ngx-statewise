import { HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LocalStorageService } from '@app/core/services/local-storage.service';
import { AuthRepositoryService } from './auth-repository.service';

@Injectable({
  providedIn: 'root',
})
export class AuthTokenService extends LocalStorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly authRepository = inject(AuthRepositoryService);

  public setAccessToken(value: string): void {
    this.setItem(this.ACCESS_TOKEN_KEY, value);
  }

  public getAccessToken(): string {
    return this.getItem(this.ACCESS_TOKEN_KEY) as string;
  }

  public clearAccessToken(): void {
    this.removeItem(this.ACCESS_TOKEN_KEY);
  }

  public setNewAccessTokenFromResponse(res: HttpResponse<any>): string {
    const newToken = res.body?.accessToken;
    if (newToken) {
      this.setAccessToken(newToken);
    }
    return newToken;
  }


}
