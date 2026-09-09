import { ErrorHandler, inject, Injectable } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { catchError, map, of } from 'rxjs';
import {
  createProjectActions,
  getAllProjectsActions,
  projectReset,
} from './project.action';
import { ProjectRepositoryService } from '../../services';
import { AUTH_SESSION } from '@app/features/common';
import { refusalReason } from '@app/core/error-handling';

@Injectable({
  providedIn: 'root',
})
export class ProjectEffect {
  private readonly projectRepository = inject(ProjectRepositoryService);
  private readonly authManager = inject(AUTH_SESSION);
  private readonly errorHandler = inject(ErrorHandler);

  /**
   * Handed over as an Observable rather than awaited through
   * `firstValueFrom`: the engine reads a one-shot source itself, so the
   * repository call needs no unwrapping here. Only the first emission counts,
   * and a source completing without emitting is a result without action.
   */
  public readonly getAllProjectsRequestEffect = createEffect(
    getAllProjectsActions.request,
    () => {
      const user = this.authManager.user();

      if (!user) {
        return getAllProjectsActions.failure();
      }

      return this.projectRepository.getAll(user.userId).pipe(
        map((projects) => getAllProjectsActions.success(projects)),
        catchError((error: unknown) => {
          this.errorHandler.handleError(error);

          return of(getAllProjectsActions.failure());
        }),
      );
    },
    /**
     * Two reloads racing each other have one useful answer between them. And
     * since this effect hands over an Observable, abandoning it unsubscribes
     * the request rather than merely ignoring its answer.
     *
     * `mustAnswer` covers the other end of the same pipeline: every branch
     * above produces an action, so a run answering nothing means the source
     * ran dry, and that would leave `isLoading` set with nothing to clear it.
     */
    { concurrency: 'latest', cancelOn: projectReset, mustAnswer: true },
  );

  /**
   * `'first'` rather than `'latest'`: a second click on a create button must
   * not supersede the creation already in flight, or the first one lands on the
   * server with nothing left watching for its answer. The form disables itself
   * on `isCreating`, and this is what holds if it is clicked anyway.
   */
  public readonly createProjectRequestEffect = createEffect(
    createProjectActions.request,
    (draft) => {
      const user = this.authManager.user();

      if (!user) {
        return createProjectActions.failure(
          'No session, so nothing to create in.',
        );
      }

      return this.projectRepository.create(draft, user.userId).pipe(
        map((project) => createProjectActions.success(project)),
        catchError((error: unknown) => {
          this.errorHandler.handleError(error);

          return of(createProjectActions.failure(refusalReason(error)));
        }),
      );
    },
    { concurrency: 'first', cancelOn: projectReset, mustAnswer: true },
  );
}
