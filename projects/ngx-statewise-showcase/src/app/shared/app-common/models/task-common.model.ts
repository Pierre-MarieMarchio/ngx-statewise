export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export const STATUSES = ['todo', 'in-progress', 'done'] as const;
export const PRIORITIES = ['low', 'medium', 'high'] as const;
