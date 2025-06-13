import { TaskPriority, TaskStatus } from '@shared/app-common/models';

export interface Task {
  id: string;
  projectId: string;
  organizationId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignedUserIds?: string[];
  dueDate?: string;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}
