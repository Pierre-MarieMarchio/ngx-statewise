import { TableColumnBase, Task } from "../models";

export const TASK_TABLE_COLUMNS: TableColumnBase<Task>[] = [
  {
    columnDef: 'title',
    header: 'Title',
    cell: (element: Task) => `${element.title}`,
  },
  {
    columnDef: 'status',
    header: 'Status',
    cell: (element: Task) => `${element.status}`,
    maxWidth: '100px',
  },
  {
    columnDef: 'priority',
    header: 'Priority',
    cell: (element: Task) => `${element.priority}`,
    maxWidth: '100px',
  },
  {
    columnDef: 'organisation',
    header: 'Organisation',
    cell: (element: Task) => `${element.organizationId}`,
    maxWidth: '100px',
    requiredRole: 'admin',
  },
];
