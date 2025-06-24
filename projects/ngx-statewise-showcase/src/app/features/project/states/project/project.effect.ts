import { inject, Injectable } from '@angular/core';
import { AUTH_MANAGER } from '@shared/app-common/tokens';
import { createEffect } from 'ngx-statewise';
import { firstValueFrom } from 'rxjs';
import { getAllProjectsActions } from './project.action';
import { ProjectRepositoryService } from '../../services';

@Injectable({
  providedIn: 'root',
})
export class ProjectEffect {
  private readonly projectRepository = inject(ProjectRepositoryService);
  private readonly authManager = inject(AUTH_MANAGER);

  public readonly getAllTaskRequestEffect = createEffect(
    getAllProjectsActions.request,
    async () => {
      try {
        const user = this.authManager.user();
        if (user) {
          const response = await firstValueFrom(
            this.projectRepository.getAll(user)
          );
          return getAllProjectsActions.success(response);
        }
        return getAllProjectsActions.failure();
      } catch (error) {
        console.error(error);
        return getAllProjectsActions.failure();
      }
    }
  );
}
