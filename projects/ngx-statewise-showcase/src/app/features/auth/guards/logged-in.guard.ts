import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthManager } from '../managers/auth-manager';

export const loggedInGuard: CanActivateFn = (route, state) => {
  const authManager = inject(AuthManager);
  const router = inject(Router);

  if (authManager.isLoggedIn()) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
