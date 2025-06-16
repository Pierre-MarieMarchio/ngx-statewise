import { inject, Injectable } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { firstValueFrom } from 'rxjs';
import { getAllTaskActions, updateTaskActions } from './task.action';
import { TaskRepositoryService } from '../../../task/services';
import { AUTH_MANAGER } from '@shared/app-common/tokens';

@Injectable({
  providedIn: 'root',
})
export class TaskEffect {
  private readonly taskRepository = inject(TaskRepositoryService);
  private readonly authManager = inject(AUTH_MANAGER);

  public readonly getAllTaskRequestEffect = createEffect(
    getAllTaskActions.request,
    async () => {
      try {
        const user = this.authManager.user();
        if (user) {
          const response = await firstValueFrom(
            this.taskRepository.getAll(user)
          );
          return getAllTaskActions.success(response);
        }
        return getAllTaskActions.failure();
      } catch (error) {
        console.error(error);
        return getAllTaskActions.failure();
      }
    }
  );

  public readonly updateTaskRequestEffect = createEffect(
    updateTaskActions.request,
    async (payload) => {
      try {
        const user = this.authManager.user();
        if (user) {
          const response = await firstValueFrom(
            this.taskRepository.update(payload.id, payload, user)
          );
          return updateTaskActions.success(response);
        }
        return updateTaskActions.failure();
      } catch (error) {
        console.error(error);
        return updateTaskActions.failure();
      }
    }
  );
}
