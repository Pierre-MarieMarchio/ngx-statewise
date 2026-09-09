import { Injectable } from '@angular/core';
import { Task, TaskStatus } from '../models';

/**
 * Which tasks a view is looking at. Pure criteria, so nothing here depends on
 * who is signed in — that is [AssignedTasksService]'s question.
 */
@Injectable({ providedIn: 'root' })
export class TaskSelectionService {
  public inStatus(
    tasks: readonly Task[] | null | undefined,
    status: TaskStatus,
  ): Task[] {
    return (tasks ?? []).filter((task) => task.status === status);
  }

  public ofProject(
    tasks: readonly Task[] | null | undefined,
    projectId: string,
  ): Task[] {
    return (tasks ?? []).filter((task) => task.projectId === projectId);
  }
}
