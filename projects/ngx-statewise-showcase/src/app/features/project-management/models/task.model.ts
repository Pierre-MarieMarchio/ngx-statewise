export interface Task {
  id: string;
  projectId: string;
  organizationId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  assignedUserIds?: string[];
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}
