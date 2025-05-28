import { Injectable, signal } from '@angular/core';
import { User } from '@shared/app-common/models';

@Injectable({
  providedIn: 'root',
})
export class AuthState {
  public user = signal<User | null>(null);
  public isLoggedIn = signal(false);
  public isLoading = signal(false);
}
