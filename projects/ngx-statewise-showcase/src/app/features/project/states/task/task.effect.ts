import { ErrorHandler, inject, Injectable } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { firstValueFrom } from 'rxjs';
import { TaskRepositoryService } from '../../services';
import { getAllTaskActions, taskReset, updateTaskActions } from './task.action';
import { AUTH_SESSION } from '@app/features/common';

@Injectable({
  providedIn: 'root',
})
export class TaskEffect {
  private readonly taskRepository = inject(TaskRepositoryService);
  private readonly authManager = inject(AUTH_SESSION);
  /**
   * The failure action tells the state what happened; this tells whatever the
   * application plugged into `ErrorHandler` why. A `console.error` told only
   * whoever had the console open.
   */
  private readonly errorHandler = inject(ErrorHandler);

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
            this.taskRepository.getAll(user.userId),
          );
          return getAllTaskActions.success(response);
        }
        return getAllTaskActions.failure();
      } catch (error) {
        this.errorHandler.handleError(error);
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
            this.taskRepository.update(task.id, task, user.userId),
          );
          return updateTaskActions.success(response);
        }
        return updateTaskActions.failure(task.id);
      } catch (error) {
        this.errorHandler.handleError(error);
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
