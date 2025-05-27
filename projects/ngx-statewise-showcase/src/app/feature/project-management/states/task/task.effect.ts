import { inject, Injectable } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { getAllTaskActions } from './task.action';
import { firstValueFrom } from 'rxjs';
import { TaskRepositoryService } from '../../services/task-repository.service';
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
      console.log("coucouc");
      
      try {
        console.log('effect');
        const user = this.authManager.user();

        if (user) {
          console.log('user');

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
}
