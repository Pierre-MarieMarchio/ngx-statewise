import { Signal } from '@angular/core';
import { LoginSubmit } from '../../../features/auth/interfaces/form-submits.interfaces';
import { User } from '../../../features/auth/interfaces/auth-user.interface';

export interface IAuthManager {
  user: Signal<User | null>;
  isLoggedIn: Signal<boolean>;
  isLoading: Signal<boolean>;

  login(credential: LoginSubmit): Promise<void>;
  authenticate(): Promise<void>;
  authenticateT(): void;
  logout(): void;
}
