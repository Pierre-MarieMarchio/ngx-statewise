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

  /**
   * The organisation's members, which is not the session.
   *
   * They get no `isLoading` and no `isError` of their own: nothing waits on
   * them, and a directory that failed to arrive shows ids instead of names —
   * a degraded label, not a screen that has to say something went wrong.
   */
  public members = signal<User[]>([]);
}
