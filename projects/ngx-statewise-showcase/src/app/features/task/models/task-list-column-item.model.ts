import { Task } from './task.model';

export interface TaskListColumnItem {
  columnDef: string;
  header: string;
  cell: (element: Task) => string;
  requiredRole?: string;
}
