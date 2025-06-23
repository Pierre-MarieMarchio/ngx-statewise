import { Task } from "@shared/app-common/models";


export interface DashbordTaskListColumnItem {
  columnDef: string;
  header: string;
  cell: (element: Task) => string;
  requiredRole?: string;
  width?: string;
  maxWidth?: string;
}
