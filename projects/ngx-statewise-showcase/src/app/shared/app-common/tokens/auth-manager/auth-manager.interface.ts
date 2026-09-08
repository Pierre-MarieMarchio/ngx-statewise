import { Signal } from '@angular/core';
import { LoginSubmit } from '../../../../features/auth/models/form-submits.model';
import { User } from '../../models/auth-user.model';

export interface IAuthManager {
  user: Signal<User | null>;
  isLoggedIn: Signal<boolean>;
  isLoading: Signal<boolean>;
  isError: Signal<boolean>;

  /** Derived from the user, so a role check never reads the state twice. */
  isAdmin: Signal<boolean>;

  login(credential: LoginSubmit): Promise<void>;
  authenticate(): Promise<void>;
  logout(): void;
}
