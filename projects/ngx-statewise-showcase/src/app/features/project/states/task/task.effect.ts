import { ErrorHandler, inject, Injectable } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { firstValueFrom } from 'rxjs';
import { TaskRepositoryService } from '../../services';
import {
  createTaskActions,
  getAllTaskActions,
  searchCleared,
  searchTaskActions,
  taskReset,
  updateTaskActions,
} from './task.action';
import { AUTH_SESSION } from '@app/features/common';
import { refusalReason } from '@app/core/error-handling';

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

        return updateTaskActions.failure({
          taskId: task.id,
          reason: 'No session, so nothing to write to.',
        });
      } catch (error) {
        this.errorHandler.handleError(error);

        return updateTaskActions.failure({
          taskId: task.id,
          reason: refusalReason(error),
        });
      }
    },
    {
      concurrency: 'latest',
      key: (task) => task.id,
      cancelOn: taskReset,
      mustAnswer: true,
    },
  );

  /**
   * The one effect in this application that reads `abortSignal`, and the reason
   * the search exists at all.
   *
   * Three effects here declare `concurrency: 'latest'` around an awaited
   * promise. That policy drops a superseded answer before it reaches an
   * updater, which is enough to keep the state right — but the request itself
   * runs to completion. Handing the signal on is what actually stops it, and
   * until this effect no one did.
   *
   * `aborted` is read a second time, in the catch. A run superseded by the next
   * keystroke rejects here, and reporting that to `ErrorHandler` would fill the
   * failures panel with the ordinary business of typing. So an abandoned run
   * answers quietly; only a real failure is reported.
   *
   * `cancelOn` takes a list: a reset means there is nothing left to search, and
   * emptying the box means no answer is wanted either.
   */
  public readonly searchTasksRequestEffect = createEffect(
    searchTaskActions.request,
    async (query, { abortSignal }) => {
      const user = this.authManager.user();

      if (!user) {
        return searchTaskActions.failure();
      }

      try {
        return searchTaskActions.success(
          await this.taskRepository.search(query, user.userId, abortSignal),
        );
      } catch (error) {
        if (!abortSignal.aborted) {
          this.errorHandler.handleError(error);
        }

        return searchTaskActions.failure();
      }
    },
    {
      concurrency: 'latest',
      cancelOn: [taskReset, searchCleared],
      mustAnswer: true,
    },
  );

  /**
   * `'first'` rather than `'latest'` — see the project's create effect: a
   * second click must not supersede a creation already on its way, leaving the
   * first with nothing watching for its answer.
   */
  public readonly createTaskRequestEffect = createEffect(
    createTaskActions.request,
    async (draft) => {
      const user = this.authManager.user();

      if (!user) {
        return createTaskActions.failure(
          'No session, so nothing to create in.',
        );
      }

      try {
        const created = await firstValueFrom(
          this.taskRepository.create(draft, user.userId),
        );

        return createTaskActions.success(created);
      } catch (error) {
        this.errorHandler.handleError(error);

        return createTaskActions.failure(refusalReason(error));
      }
    },
    { concurrency: 'first', cancelOn: taskReset, mustAnswer: true },
  );
}
