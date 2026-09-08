import { inject, Injectable, signal } from '@angular/core';
import {
  AUTH_MANAGER,
  PROJECT_MANAGER,
  TASK_MANAGER,
} from '@shared/app-common/tokens';
import type { LoginSubmit } from '../models';

/**
 * Signing in as somebody else, which is more than signing in.
 *
 * The login cascade reloads the tasks and the projects, but it does so through
 * each manager's own handle — and observation is scoped exactly like dispatch,
 * so `await login()` settles while both reloads are still in flight. A picker
 * that re-enables itself there is inviting the next click into a half-loaded
 * dashboard.
 *
 * So it waits on the managers too, which is what `waitForEffect` and
 * `waitForAllEffects` are for.
 */
@Injectable({ providedIn: 'root' })
export class UserSwitchService {
  private readonly authManager = inject(AUTH_MANAGER);
  private readonly taskManager = inject(TASK_MANAGER);
  private readonly projectManager = inject(PROJECT_MANAGER);

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
