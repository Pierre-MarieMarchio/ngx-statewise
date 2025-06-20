import { Task } from "@shared/app-common/models";


export interface TaskListColumnItem {
  columnDef: string;
  header: string;
  cell: (element: Task) => string;
  requiredRole?: string;
  width?: string; 
  maxWidth?: string; 
}
