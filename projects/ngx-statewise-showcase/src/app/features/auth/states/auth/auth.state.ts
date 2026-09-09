import { Injectable, signal } from '@angular/core';
import { User } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class AuthState {
  public user = signal<User | null>(null);
  public isLoggedIn = signal(false);
  public isLoading = signal(false);
  public isError = signal(false);
}
