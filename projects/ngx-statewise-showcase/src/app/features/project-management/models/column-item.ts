import { Task } from './task.model';

export interface TaskColumn {
  columnDef: string;
  header: string;
  cell: (element: Task) => string;
  requiredRole?: string;
}
