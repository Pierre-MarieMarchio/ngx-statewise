import { inject, Injectable } from '@angular/core';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import { createEffect } from 'ngx-statewise';
import { catchError, map, of } from 'rxjs';
import { getAllProjectsActions, projectReset } from './project.action';
import { ProjectRepositoryService } from '../../services';

@Injectable({
  providedIn: 'root',
})
export class ProjectEffect {
  private readonly projectRepository = inject(ProjectRepositoryService);
  private readonly authManager = inject(AUTH_MANAGER);

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

      return this.projectRepository.getAll(user).pipe(
        map((projects) => getAllProjectsActions.success(projects)),
        catchError((error: unknown) => {
          console.error(error);

          return of(getAllProjectsActions.failure());
        }),
      );
    },
    /**
     * Two reloads racing each other have one useful answer between them. And
     * since this effect hands over an Observable, abandoning it unsubscribes
     * the request rather than merely ignoring its answer.
     */
    { concurrency: 'latest', cancelOn: projectReset },
  );
}
