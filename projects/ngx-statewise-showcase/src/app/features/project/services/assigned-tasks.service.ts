import { inject, Injectable } from '@angular/core';
import { Task } from '../models';
import { AUTH_SESSION } from '@app/features/common';

/**
 * What "my tasks" means. Separate from the other criteria because it is the
 * one that depends on the session, so it changes when the notion of an
 * assignee changes rather than when a filter does.
 */
@Injectable({ providedIn: 'root' })
export class AssignedTasksService {
  private readonly authManager = inject(AUTH_SESSION);

  /** The tasks assigned to whoever is signed in, none when nobody is. */
  public ofCurrentUser(tasks: readonly Task[]): Task[] {
    const userId = this.authManager.user()?.userId;

    if (userId === undefined) {
      return [];
    }

    return tasks.filter((task) => task.assignedUserIds?.includes(userId));
  }
}
