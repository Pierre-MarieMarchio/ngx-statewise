export interface TableColumnBase<TData = any> {
  columnDef: string;
  header: string;
  cell: (element: TData) => string;
  maxWidth?: string;
  requiredRole?: string;
}
