export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

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

export const STATUSES = ['todo', 'in-progress', 'done'] as const;
export const PRIORITIES = ['low', 'medium', 'high'] as const;
