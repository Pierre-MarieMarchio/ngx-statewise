import { inject, Injectable, signal } from '@angular/core';
import type { LoginSubmit } from '../models';
import { PROJECT_RELOAD, TASK_RELOAD } from '@app/features/common';
import { AuthManager } from '@app/features/auth/states';

/**
 * Signing in as somebody else, which is more than signing in.
 *
 * The login cascade reloads the tasks and the projects, but it does so through
 * each manager's own handle, and observation is scoped exactly like dispatch,
 * so `await login()` settles while both reloads are still in flight. A picker
 * that re-enables itself there is inviting the next click into a half-loaded
 * dashboard.
 *
 * So it waits on the managers too, which is what `waitForEffect` and
 * `waitForAllEffects` are for.
 */
@Injectable({ providedIn: 'root' })
export class UserSwitchService {
  private readonly authManager = inject(AuthManager);
  private readonly taskManager = inject(TASK_RELOAD);
  private readonly projectManager = inject(PROJECT_RELOAD);

  private readonly switching = signal(false);

  /** True until the new user's data has arrived, not just their session. */
  public readonly isSwitching = this.switching.asReadonly();

  public async switchTo(credentials: LoginSubmit): Promise<void> {
    this.switching.set(true);

    try {
      await this.authManager.login(credentials);
      await Promise.all([
        this.taskManager.reloaded(),
        this.projectManager.settled(),
      ]);
    } finally {
      this.switching.set(false);
    }
  }
}
