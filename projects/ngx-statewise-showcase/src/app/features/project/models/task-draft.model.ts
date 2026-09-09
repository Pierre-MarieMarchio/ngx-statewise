import { TaskPriority, TaskStatus } from './task-common.model';

/**
 * A task on its way to the server.
 *
 * `id`, `createdAt`, `updatedAt` and `organizationId` are all the server's:
 * the first three because only it can mint them, the last because it reads it
 * off whoever is asking rather than trusting the request.
 */
export interface TaskDraft {
  readonly projectId: string;
  readonly title: string;
  readonly description?: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly dueDate?: string;
  readonly assignedUserIds?: string[];
}
