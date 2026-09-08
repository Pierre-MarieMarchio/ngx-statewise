import { inject, Injectable } from '@angular/core';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import { createEffect } from 'ngx-statewise';
import { firstValueFrom } from 'rxjs';
import { TaskRepositoryService } from '../../../task/services';
import { getAllTaskActions, taskReset, updateTaskActions } from './task.action';

@Injectable({
  providedIn: 'root',
})
export class TaskEffect {
  private readonly taskRepository = inject(TaskRepositoryService);
  private readonly authManager = inject(AUTH_MANAGER);

  /**
   * Two reloads racing each other have one useful answer between them, so the
   * newest supersedes the one in flight. A reset means there is no list left
   * to fill, and abandoning also unsubscribes the request itself.
   */
  public readonly getAllTaskRequestEffect = createEffect(
    getAllTaskActions.request,
    async () => {
      try {
        const user = this.authManager.user();
        if (user) {
          const response = await firstValueFrom(
            this.taskRepository.getAll(user),
          );
          return getAllTaskActions.success(response);
        }
        return getAllTaskActions.failure();
      } catch (error) {
        console.error(error);
        return getAllTaskActions.failure();
      }
    },
    { concurrency: 'latest', cancelOn: taskReset, mustAnswer: true },
  );

  /**
   * One concurrency group per task: dragging a second card must not abandon
   * the write of the first, while dragging the same card twice must abandon
   * its own earlier write — otherwise the slow answer lands last and the card
   * goes back to where the user no longer wants it.
   */
  public readonly updateTaskRequestEffect = createEffect(
    updateTaskActions.request,
    async (task) => {
      try {
        const user = this.authManager.user();
        if (user) {
          const response = await firstValueFrom(
            this.taskRepository.update(task.id, task, user),
          );
          return updateTaskActions.success(response);
        }
        return updateTaskActions.failure(task.id);
      } catch (error) {
        console.error(error);
        return updateTaskActions.failure(task.id);
      }
    },
    {
      concurrency: 'latest',
      key: (task) => task.id,
      cancelOn: taskReset,
      mustAnswer: true,
    },
  );
}
