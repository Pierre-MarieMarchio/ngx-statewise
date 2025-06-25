import { computed, Injectable, Signal } from '@angular/core';
import { TableColumnBase, User } from '@shared/app-common/models';

@Injectable({
  providedIn: 'root',
})
export class DynamicTableColumnsService {
  // public readonly defaultColumns: TaskListColumnItem[] = [
  //   {
  //     columnDef: 'title',
  //     header: 'Title',
  //     cell: (element: Task) => `${element.title}`,
  //   },
  //   {
  //     columnDef: 'status',
  //     header: 'Status',
  //     cell: (element: Task) => `${element.status}`,
  //     maxWidth: '100px',
  //   },
  //   {
  //     columnDef: 'priority',
  //     header: 'Priority',
  //     cell: (element: Task) => `${element.priority}`,
  //     maxWidth: '100px',
  //   },
  //   {
  //     columnDef: 'organisation',
  //     header: 'Organisation',
  //     cell: (element: Task) => `${element.organizationId}`,
  //     maxWidth: '100px',
  //     requiredRole: 'admin',
  //   },
  // ];

  public getDisplayedColumns<T extends TableColumnBase>(
    columns: T[],
    user: Signal<User | null>
  ): Signal<T[]> {
    return computed(() => {
      const currentUser = user();
      return columns.filter(
        (col) => !col.requiredRole || col.requiredRole === currentUser?.role
      );
    });
  }

  public getColumnKeys<T extends TableColumnBase>(
    columns: Signal<T[]>
  ): Signal<string[]> {
    return computed(() => columns().map((c) => c.columnDef));
  }

  public getColumnsConfig<T extends TableColumnBase>(
    user: Signal<User | null>,
    columns: T[]
  ) {
    const displayedColumns = this.getDisplayedColumns(columns, user);
    const columnKeys = this.getColumnKeys(displayedColumns);

    return {
      displayedColumns,
      columnKeys,
    };
  }

  public getColumnsWithoutSpecific<T extends TableColumnBase>(
    columns: T[],
    excludedColumns: string[],
    user: Signal<User | null>
  ) {
    const filteredColumns = columns.filter(
      (col) => !excludedColumns.includes(col.columnDef)
    );

    return this.getColumnsConfig(user, filteredColumns);
  }
}
