import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  output,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatCellDef,
  MatColumnDef,
  MatHeaderCellDef,
  MatTable,
  MatTableModule,
} from '@angular/material/table';
import { Task } from '../../models';

/**
 * The column that opens a task, for whichever table it sits in.
 *
 * Four tables end with it, and writing the `matColumnDef` in four templates
 * would be four copies of the same markup. A column declared inside a
 * component is not content of the table around it, so it hands its definition
 * over the way the CDK's own `CdkTextColumn` does.
 *
 * `@ViewChild(… { static: true })` rather than a signal query: the table reads
 * its columns in `ngAfterContentChecked`, so the definition has to be there by
 * `ngOnInit`, and a signal query is not resolved that early. The two cell
 * templates are handed over by hand for the same reason `CdkTextColumn` does
 * it — the column's own content queries do not see them from here, and the
 * row definition fails reading `template` off nothing.
 */
@Component({
  selector: 'app-task-open-column',
  imports: [MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <ng-container matColumnDef="open">
      <th mat-header-cell *matHeaderCellDef class="open-cell">
        <span class="visually-hidden">Open</span>
      </th>
      <td mat-cell *matCellDef="let task" class="open-cell">
        <!--
          The row click is a mouse shortcut; this button is the path a keyboard
          has, and the only one that announces itself. It stops the propagation
          so one press stays one selection.
        -->
        <button
          mat-icon-button
          type="button"
          [attr.aria-label]="'Open ' + task.title"
          (click)="$event.stopPropagation(); opened.emit(task)"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
      </td>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskOpenColumnComponent implements OnInit, OnDestroy {
  public readonly opened = output<Task>();

  private readonly table = inject(MatTable);

  @ViewChild(MatColumnDef, { static: true })
  private readonly columnDef!: MatColumnDef;

  @ViewChild(MatCellDef, { static: true })
  private readonly cell!: MatCellDef;

  @ViewChild(MatHeaderCellDef, { static: true })
  private readonly headerCell!: MatHeaderCellDef;

  public ngOnInit(): void {
    this.columnDef.cell = this.cell;
    this.columnDef.headerCell = this.headerCell;
    this.table.addColumnDef(this.columnDef);
  }

  public ngOnDestroy(): void {
    this.table.removeColumnDef(this.columnDef);
  }
}
