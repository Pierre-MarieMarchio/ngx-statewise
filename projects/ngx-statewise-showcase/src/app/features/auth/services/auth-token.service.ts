import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocalStorageService } from '@app/core/services/local-storage.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthTokenService extends LocalStorageService {



  public setAccessToken(value: string): void {
    this.setItem(environment.ACCESS_TOKEN_KEY, value);
  }

  public getAccessToken(): string {
    return this.getItem(environment.ACCESS_TOKEN_KEY) as string;
  }

  public clearAccessToken(): void {
    this.removeItem(environment.ACCESS_TOKEN_KEY);
  }

  public setRefreshToken(value: string): void {
    this.setItem(environment.REFRESH_TOKEN_KEY, value);
  }

  public getRefreshToken(): string {
    return this.getItem(environment.REFRESH_TOKEN_KEY) as string;
  }

  public clearRefreshToken(): void {
    this.removeItem(environment.REFRESH_TOKEN_KEY);
  }

  public setNewAccessTokenFromResponse(res: HttpResponse<any>): string {
    const newToken = res.body?.accessToken;
    if (newToken) {
      this.setAccessToken(newToken);
    }
    return newToken;
  }
}
