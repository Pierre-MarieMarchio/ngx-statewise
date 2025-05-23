import { Signal } from '@angular/core';
import { LoginSubmit } from '../../../../feature/auth/models/form-submits.model';
import { User } from '../../models/auth-user.model';

export interface IAuthManager {
  user: Signal<User | null>;
  isLoggedIn: Signal<boolean>;
  isLoading: Signal<boolean>;

  login(credential: LoginSubmit): Promise<void>;
  authenticate(): Promise<void>;
  authenticateT(): void;
  logout(): void;
}
